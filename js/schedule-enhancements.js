/**
 * Schedule performance + accessibility enhancements.
 * Loaded after schedule.js so the core schedule logic stays isolated.
 */
(() => {
    'use strict';

    // Memoize date parsing: renderCalendar can inspect the same event date many times.
    const originalDateParts = window.getVietnamDateParts;
    const dateCache = new Map();
    if (typeof originalDateParts === 'function') {
        window.getVietnamDateParts = (dateStr) => {
            const key = String(dateStr ?? '');
            if (dateCache.has(key)) return dateCache.get(key);
            const value = originalDateParts(dateStr);
            dateCache.set(key, value);
            return value;
        };
    }

    // Keep a short-lived local cache so repeat visits can recover instantly while the API refreshes.
    const CACHE_KEY = 'tvlt:schedule:v2';
    const CACHE_TTL = 5 * 60 * 1000;
    const readScheduleCache = () => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            return cached?.events?.length && Date.now() - cached.time < CACHE_TTL ? cached.events : null;
        } catch (_) {
            return null;
        }
    };
    const writeScheduleCache = (events) => {
        try {
            if (Array.isArray(events)) localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), events }));
        } catch (_) { /* Storage may be unavailable. */ }
    };

    const scheduleFilter = window.filterSchedule;
    if (typeof scheduleFilter === 'function') {
        let timer = 0;
        window.filterSchedule = function optimizedFilterSchedule() {
            window.clearTimeout(timer);
            timer = window.setTimeout(scheduleFilter, 120);
        };
    }

    const observeScheduleImages = () => {
        const roots = [document.getElementById('calendar-body'), document.getElementById('list-container')].filter(Boolean);
        roots.forEach((root) => root.querySelectorAll('img:not([loading])').forEach((img) => {
            if (!img.closest('#modal-banner, #modal-logo')) {
                img.loading = 'lazy';
                img.decoding = 'async';
            }
        }));
    };

    let imageFrame = 0;
    const imageObserver = new MutationObserver(() => {
        if (imageFrame) return;
        imageFrame = requestAnimationFrame(() => {
            imageFrame = 0;
            observeScheduleImages();
        });
    });

    const init = () => {
        observeScheduleImages();

        const cachedEvents = readScheduleCache();
        if (cachedEvents && Array.isArray(window.tournaments) && !window.tournaments.length) {
            window.tournaments = cachedEvents;
            window.dispatchEvent(new CustomEvent('tvlt:schedule-cache-ready'));
        }

        const calendarBody = document.getElementById('calendar-body');
        const listContainer = document.getElementById('list-container');
        if (calendarBody) imageObserver.observe(calendarBody, { childList: true, subtree: true });
        if (listContainer) imageObserver.observe(listContainer, { childList: true, subtree: true });

        const modal = document.getElementById('eventModal');
        const modalDialog = modal?.querySelector('.cc-modal-dialog');
        const closeButton = modal?.querySelector('.cc-modal-close');
        let previousFocus = null;

        if (modal) {
            const modalObserver = new MutationObserver(() => {
                const opened = modal.classList.contains('open');
                if (opened && !previousFocus) {
                    previousFocus = document.activeElement;
                    closeButton?.focus({ preventScroll: true });
                } else if (!opened && previousFocus) {
                    previousFocus.focus?.({ preventScroll: true });
                    previousFocus = null;
                }
            });
            modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });

            modal.addEventListener('keydown', (event) => {
                if (event.key !== 'Tab' || !modal.classList.contains('open')) return;
                const focusable = modalDialog?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
                if (!focusable?.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            });
        }
    };

    // Capture successful live responses without replacing the core loader.
    const nativeFetch = window.fetch;
    if (typeof nativeFetch === 'function') {
        window.fetch = function scheduleAwareFetch(input, init) {
            const url = typeof input === 'string' ? input : input?.url;
            return nativeFetch.call(this, input, init).then((response) => {
                if (url?.includes('script.google.com/macros/s/') && response.ok) {
                    response.clone().text().then((text) => {
                        try {
                            const data = JSON.parse(text);
                            writeScheduleCache(data.events || data.tournaments || []);
                        } catch (_) { /* Preserve the original response for schedule.js. */ }
                    });
                }
                return response;
            });
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
