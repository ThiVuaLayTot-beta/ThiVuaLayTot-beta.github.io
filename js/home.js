/**
 * Hiệu ứng trang chủ (index.html): đếm số ở các thẻ thống kê và hiện dần các
 * khối nội dung khi cuộn tới. Dùng IntersectionObserver và requestAnimationFrame
 * thay cho thư viện WOW.js; tắt hẳn khi người dùng chọn giảm chuyển động.
 *
 * Dự phòng ảnh lỗi (data-fallback-src) do main.js xử lý ở mọi trang.
 * Số liệu thống kê được đồng bộ từ API ngay tại đây (trước khi đếm số) và ghi vào
 * data-final-value để bộ đếm luôn kết thúc ở giá trị mới nhất.
 */
(() => {
  "use strict";

  const COUNTER_SELECTOR = ".bento-stat strong";
  const COUNTER_FIRST_DELAY_MS = 260;
  const COUNTER_STAGGER_MS = 110;
  const COUNTER_DURATION_MS = 1450;

  const REVEAL_SELECTOR = [
    ".feature-section .section-kicker",
    ".feature-grid .feature-card",
    ".founder-profile__media",
    ".founder-profile__content",
    ".highlight-section .section-kicker",
    ".blog-section .section-kicker",
    ".post-grid .post-card",
  ].join(",");
  const REVEAL_STAGGER_MS = 85;
  const REVEAL_MAX_STAGGER_INDEX = 4;
  // Chỉ ẩn trước các khối nằm dưới màn hình đầu tiên.
  const REVEAL_BELOW_FOLD_RATIO = 0.9;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const numberFormat = new Intl.NumberFormat("vi-VN");
  const runningCounters = new Map();
  let revealObserver = null;

  /* ---------- Đồng bộ số liệu thống kê ---------- */

  const STATS_CACHE_KEY = "tvlt_homepage_stats_cache_v1";
  const STATS_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
  const CHESSCOM_CLUB_API = "https://api.chess.com/pub/club/thi-vua-lay-tot-tungjohn-playing-chess";

  /**
   * Nguồn, theo thứ tự ưu tiên: cache còn mới -> Apps Script (data-stats-api) -> Chess.com
   * (chỉ số thành viên). Không có nguồn nào thì giữ số dựng sẵn lúc build.
   */
  async function syncHomepageStats() {
    const card = document.querySelector(".bento-card--stats");
    const youtubeElement = document.getElementById("stat-youtube-subs");
    const membersElement = document.getElementById("stat-chesscom-members");
    const eventsElement = document.getElementById("stat-prize-events");
    if (!youtubeElement && !membersElement && !eventsElement) return;

    const statsApiUrl = (card?.getAttribute("data-stats-api") || "").trim();
    // Số liệu dựng sẵn lúc build (_data/stats.json); cache cũ hơn nó không được ghi đè.
    const builtAt = Date.parse(card?.getAttribute("data-updated-at") || "") || 0;

    const setStat = (element, value) => {
      if (!element || !value) return;
      element.dataset.finalValue = value;
      element.textContent = value;
    };
    const applyStats = (stats) => {
      if (!stats) return;
      setStat(youtubeElement, stats.youtubeSubs);
      setStat(membersElement, stats.chesscomMembers);
      setStat(eventsElement, stats.prizeEvents);
    };
    const saveCache = (value) => {
      try { localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(value)); } catch (error) { /* storage không khả dụng */ }
    };

    try {
      const cached = JSON.parse(localStorage.getItem(STATS_CACHE_KEY) || "null");
      const isFresh = cached && Date.now() - cached.updatedAt < STATS_CACHE_TTL_MS && cached.updatedAt > builtAt;
      if (isFresh) {
        const usable = statsApiUrl
          ? cached.source === "apps-script" && (cached.youtubeSubs || cached.chesscomMembers || cached.prizeEvents)
          : cached.chesscomMembers;
        if (usable) {
          applyStats(cached);
          return;
        }
      }
    } catch (error) { /* bỏ qua cache hỏng */ }

    if (statsApiUrl) {
      try {
        const response = await fetch(statsApiUrl);
        if (response.ok) {
          const data = await response.json();
          const next = {
            youtubeSubs: data.youtube_subs || "",
            chesscomMembers: data.chesscom_members || "",
            prizeEvents: data.prize_events || "",
            source: "apps-script",
            updatedAt: Date.now(),
          };
          if (next.youtubeSubs || next.chesscomMembers || next.prizeEvents) {
            applyStats(next);
            saveCache(next);
            return;
          }
        }
      } catch (error) { /* chuyển sang Chess.com */ }
    }

    if (!membersElement) return;
    try {
      const response = await fetch(CHESSCOM_CLUB_API);
      if (!response.ok) return;
      const data = await response.json();
      if (typeof data.members_count === "number" && data.members_count > 0) {
        const formatted = data.members_count >= 1000 ? `${Math.floor(data.members_count / 1000)}K+` : String(data.members_count);
        setStat(membersElement, formatted);
        saveCache({ chesscomMembers: formatted, source: "chesscom-api", updatedAt: Date.now() });
      }
    } catch (error) { /* giữ số dựng sẵn */ }
  }

  /* ---------- Đếm số ---------- */

  /** "174K+" -> { target: 174, suffix: "K+" }; "1.250+" -> số có dấu phân cách nhóm. */
  function parseCounter(rawText) {
    const original = String(rawText).trim();
    const match = original.match(/^(\d[\d.,]*)(.*)$/);
    if (!match) return null;

    const target = Number(match[1].replace(/[^\d]/g, ""));
    if (!Number.isFinite(target) || target <= 0) return null;

    return { target, suffix: match[2], grouped: /[.,]/.test(match[1]), original };
  }

  /** Giá trị cuối: ưu tiên số mới do main.js đồng bộ từ API, nếu có. */
  const getFinalText = (element, counter) => element.dataset.finalValue || counter.finalText;

  function stopCounter(element, counter) {
    window.clearTimeout(counter.timer);
    if (counter.frame) window.cancelAnimationFrame(counter.frame);
    runningCounters.delete(element);
  }

  function settleCounter(element, counter) {
    stopCounter(element, counter);
    element.textContent = getFinalText(element, counter);
  }

  function countUp(element, delay) {
    if (element.dataset.homeCounted === "true") return;

    const stat = parseCounter(element.textContent);
    if (!stat) return;
    element.dataset.homeCounted = "true";

    const counter = { timer: 0, frame: 0, startedAt: 0, finalText: stat.original };
    const format = (value) => {
      const rounded = Math.round(value);
      return (stat.grouped ? numberFormat.format(rounded) : String(rounded)) + stat.suffix;
    };

    const tick = (timestamp) => {
      if (reducedMotion.matches) {
        settleCounter(element, counter);
        return;
      }

      if (!counter.startedAt) counter.startedAt = timestamp;
      const progress = Math.min((timestamp - counter.startedAt) / COUNTER_DURATION_MS, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      element.textContent = format(stat.target * eased);

      if (progress < 1) counter.frame = window.requestAnimationFrame(tick);
      else settleCounter(element, counter);
    };

    runningCounters.set(element, counter);
    counter.timer = window.setTimeout(() => {
      element.textContent = format(0);
      counter.frame = window.requestAnimationFrame(tick);
    }, delay);
  }

  /* ---------- Hiện dần khi cuộn tới ---------- */

  function initializeReveal() {
    if (!("IntersectionObserver" in window)) return;

    // Đọc toàn bộ vị trí trước, rồi mới ghi, để chỉ tốn một lần layout.
    const targets = Array.from(document.querySelectorAll(REVEAL_SELECTOR)).filter(
      (element) => element.getBoundingClientRect().top >= window.innerHeight * REVEAL_BELOW_FOLD_RATIO,
    );
    if (!targets.length) return;

    // Độ trễ so le theo thứ tự của khối trong nhóm anh em cùng loại.
    const peersByParent = new Map();
    targets.forEach((element) => {
      const parent = element.parentElement;
      let peers = peersByParent.get(parent);
      if (!peers) {
        peers = Array.from(parent.children).filter((child) => child.matches(REVEAL_SELECTOR));
        peersByParent.set(parent, peers);
      }

      const order = Math.min(peers.indexOf(element), REVEAL_MAX_STAGGER_INDEX);
      element.setAttribute("data-home-reveal", "");
      element.style.setProperty("--home-reveal-delay", order * REVEAL_STAGGER_MS + "ms");
    });

    document.documentElement.classList.add("home-motion-ready");

    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-home-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((element) => revealObserver.observe(element));
  }

  /* ---------- Giảm chuyển động ---------- */

  /** Người dùng bật "giảm chuyển động" giữa chừng: đưa mọi thứ về trạng thái cuối. */
  function completeMotion() {
    Array.from(runningCounters).forEach(([element, counter]) => settleCounter(element, counter));

    revealObserver?.disconnect();
    revealObserver = null;

    document.documentElement.classList.remove("home-motion-ready");
    document.querySelectorAll("[data-home-reveal]").forEach((element) => {
      element.classList.remove("is-home-visible");
      element.removeAttribute("data-home-reveal");
      element.style.removeProperty("--home-reveal-delay");
    });
  }

  // Đồng bộ số liệu trước khi đọc số cần đếm (cache được áp dụng ngay); độc lập với chế độ giảm chuyển động.
  syncHomepageStats();

  if (reducedMotion.matches) return;

  document.querySelectorAll(COUNTER_SELECTOR).forEach((element, index) => {
    countUp(element, COUNTER_FIRST_DELAY_MS + index * COUNTER_STAGGER_MS);
  });
  initializeReveal();

  const onMotionPreferenceChange = (event) => {
    if (event.matches) completeMotion();
  };
  // Safari < 14 chỉ có addListener.
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(onMotionPreferenceChange);
  }
})();
