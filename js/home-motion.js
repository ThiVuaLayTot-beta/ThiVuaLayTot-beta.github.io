/* Homepage motion and stat counters.
   Loaded with defer on index.html; no dependencies or global namespace. */
(() => {
  "use strict";

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionPreference.matches) return;

  const activeCounters = new Map();
  let revealObserver = null;

  function parseCounter(value) {
    const match = String(value).trim().match(/^(\d[\d.,]*)(.*)$/);
    if (!match) return null;

    const target = Number(match[1].replace(/[^\d]/g, ""));
    if (!Number.isFinite(target) || target <= 0) return null;

    return {
      target,
      suffix: match[2],
      grouped: /[.,]/.test(match[1]),
      finalText: String(value).trim(),
    };
  }

  function countUp(element, delay) {
    if (element.dataset.homeCounted === "true") return;

    const stat = parseCounter(element.textContent);
    if (!stat) return;

    element.dataset.homeCounted = "true";

    const state = {
      frame: 0,
      timer: 0,
      start: 0,
      finalText: stat.finalText,
    };

    const format = (value) => {
      const rounded = Math.round(value);
      const number = stat.grouped
        ? rounded.toLocaleString("vi-VN")
        : String(rounded);
      return number + stat.suffix;
    };

    const finish = () => {
      window.clearTimeout(state.timer);
      if (state.frame) window.cancelAnimationFrame(state.frame);
      element.textContent = state.finalText;
      activeCounters.delete(element);
    };

    const tick = (now) => {
      if (motionPreference.matches) {
        finish();
        return;
      }

      if (!state.start) state.start = now;
      const progress = Math.min((now - state.start) / 1450, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      element.textContent = format(stat.target * eased);

      if (progress < 1) {
        state.frame = window.requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    activeCounters.set(element, state);
    state.timer = window.setTimeout(() => {
      element.textContent = format(0);
      state.frame = window.requestAnimationFrame(tick);
    }, delay);
  }

  function setupScrollReveal() {
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
      const siblings = element.parentElement
        ? Array.from(element.parentElement.children).filter((child) => child.matches(selector))
        : [element];
      const index = Math.max(0, Math.min(siblings.indexOf(element), 4));

      element.setAttribute("data-home-reveal", "");
      element.style.setProperty("--home-reveal-delay", index * 85 + "ms");
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
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    targets.forEach((element) => revealObserver.observe(element));
  }

  function completeMotionAndReveal() {
    activeCounters.forEach((state, element) => {
      window.clearTimeout(state.timer);
      if (state.frame) window.cancelAnimationFrame(state.frame);
      element.textContent = state.finalText;
    });
    activeCounters.clear();

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

  document.querySelectorAll(".bento-stat strong").forEach((element, index) => {
    countUp(element, 260 + index * 110);
  });

  setupScrollReveal();

  const handleMotionPreferenceChange = (event) => {
    if (event.matches) completeMotionAndReveal();
  };

  if (typeof motionPreference.addEventListener === "function") {
    motionPreference.addEventListener("change", handleMotionPreferenceChange);
  } else if (typeof motionPreference.addListener === "function") {
    motionPreference.addListener(handleMotionPreferenceChange);
  }
})();
