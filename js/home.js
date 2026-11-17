/* TVLT homepage interactions.
   Native IntersectionObserver and requestAnimationFrame replace the unused WOW.js library. */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const runningCounters = new Map();
  let revealObserver = null;

  function parseCounter(rawText) {
    const original = String(rawText).trim();
    const match = original.match(/^(\d[\d.,]*)(.*)$/);
    if (!match) return null;

    const target = Number(match[1].replace(/[^\d]/g, ""));
    if (!Number.isFinite(target) || target <= 0) return null;

    return {
      target,
      suffix: match[2],
      grouped: /[.,]/.test(match[1]),
      original,
    };
  }

  function countUp(element, delay = 0) {
    if (element.dataset.homeCounted === "true") return;

    const stat = parseCounter(element.textContent);
    if (!stat) return;

    element.dataset.homeCounted = "true";

    const state = { timer: 0, frame: 0, startedAt: 0, finalText: stat.original };

    const format = (value) => {
      const rounded = Math.round(value);
      const number = stat.grouped ? rounded.toLocaleString("vi-VN") : String(rounded);
      return number + stat.suffix;
    };

    const finish = () => {
      window.clearTimeout(state.timer);
      if (state.frame) window.cancelAnimationFrame(state.frame);
      element.textContent = state.finalText;
      runningCounters.delete(element);
    };

    const tick = (timestamp) => {
      if (reducedMotion.matches) {
        finish();
        return;
      }

      if (!state.startedAt) state.startedAt = timestamp;
      const progress = Math.min((timestamp - state.startedAt) / 1450, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      element.textContent = format(stat.target * eased);

      if (progress < 1) state.frame = window.requestAnimationFrame(tick);
      else finish();
    };

    runningCounters.set(element, state);
    state.timer = window.setTimeout(() => {
      element.textContent = format(0);
      state.frame = window.requestAnimationFrame(tick);
    }, delay);
  }

  function initializeReveal() {
    if (!("IntersectionObserver" in window)) return;

    const selector = [
      ".feature-section .section-kicker",
      ".feature-grid .feature-card",
      ".founder-profile__media",
      ".founder-profile__content",
      ".highlight-section .section-kicker",
      ".blog-section .section-kicker",
      ".post-grid .post-card",
    ].join(",");

    const targets = Array.from(document.querySelectorAll(selector)).filter(
      (element) => element.getBoundingClientRect().top >= window.innerHeight * 0.9,
    );

    if (!targets.length) return;

    targets.forEach((element) => {
      const peers = element.parentElement
        ? Array.from(element.parentElement.children).filter((child) => child.matches(selector))
        : [element];
      const order = Math.max(0, Math.min(peers.indexOf(element), 4));

      element.setAttribute("data-home-reveal", "");
      element.style.setProperty("--home-reveal-delay", order * 85 + "ms");
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

  function completeMotion() {
    runningCounters.forEach((state, element) => {
      window.clearTimeout(state.timer);
      if (state.frame) window.cancelAnimationFrame(state.frame);
      element.textContent = state.finalText;
    });
    runningCounters.clear();

    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    document.documentElement.classList.remove("home-motion-ready");
    document.querySelectorAll("[data-home-reveal]").forEach((element) => {
      element.classList.remove("is-home-visible");
      element.removeAttribute("data-home-reveal");
      element.style.removeProperty("--home-reveal-delay");
    });
  }

  if (reducedMotion.matches) return;

  document.querySelectorAll(".bento-stat strong").forEach((element, index) => {
    countUp(element, 260 + index * 110);
  });
  initializeReveal();

  const onMotionPreferenceChange = (event) => {
    if (event.matches) completeMotion();
  };

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(onMotionPreferenceChange);
  }
})();
