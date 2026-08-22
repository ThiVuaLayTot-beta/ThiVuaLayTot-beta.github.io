/**
 * Schedule performance + accessibility enhancements.
 * Loaded before schedule.js so the API cache can intercept the initial request.
 */
(() => {
    'use strict';

    const API_MARKER = 'script.google.com/macros/s/';
    const CACHE_KEY = 'tvlt:schedule:v3';
    const CACHE_TTL = 5 * 60 * 1000;
    const nativeFetch = window.fetch?.bind(window);

    const readCache = (allowExpired = false) => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (!cached?.time || !cached?.payload) return null;
            if (!allowExpired && Date.now() - cached.time >= CACHE_TTL) return null;
            return cached;
        } catch (_) {
            return null;
        }
    };

    const writeCache = (payload) => {
        try {
            if (payload && typeof payload === 'object' && Array.isArray(payload.events || payload.tournaments)) {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), payload }));
            }
        } catch (_) {
            // Storage may be unavailable or full; the live API remains authoritative.
        }
    };

    const cacheResponse = (cached) => new Response(JSON.stringify(cached.payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

    const refreshCache = (input, init) => {
        if (!nativeFetch) return;
        nativeFetch(input, init).then((response) => {
            if (!response.ok) return;
            response.clone().json().then(writeCache).catch(() => {});
        }).catch(() => {});
    };

    // Intercept only the schedule API. Cached data renders immediately; a background
    // request refreshes the cache for the next visit without blocking the UI.
    if (nativeFetch) {
        window.fetch = (input, init) => {
            const url = typeof input === 'string' ? input : input?.url || '';
            if (!url.includes(API_MARKER)) return nativeFetch(input, init);

            const fresh = readCache();
            if (fresh) {
                refreshCache(input, init);
                return Promise.resolve(cacheResponse(fresh));
            }

            return nativeFetch(input, init).then((response) => {
                if (response.ok) {
                    response.clone().json().then(writeCache).catch(() => {});
                    return response;
                }

                const stale = readCache(true);
                return stale ? cacheResponse(stale) : response;
            }).catch((error) => {
                const stale = readCache(true);
                if (stale) return cacheResponse(stale);
                throw error;
            });
        };
    }

    const observeScheduleImages = () => {
        const roots = [
            document.getElementById('calendar-body'),
            document.getElementById('list-container')
        ].filter(Boolean);

        roots.forEach((root) => {
            root.querySelectorAll('img:not([loading])').forEach((img) => {
                if (!img.closest('#modal-banner, #modal-logo')) {
                    img.loading = 'lazy';
                    img.decoding = 'async';
                }
            });
        });
    };

    const init = () => {
        // Memoize repeated date parsing only after schedule.js has defined the helper.
        const originalDateParts = window.getVietnamDateParts;
        if (typeof originalDateParts === 'function' && !originalDateParts.__tvltMemoized) {
            const dateCache = new Map();
            const memoizedDateParts = (dateStr) => {
                const key = String(dateStr ?? '');
                if (dateCache.has(key)) return dateCache.get(key);
                const value = originalDateParts(dateStr);
                dateCache.set(key, value);
                return value;
            };
            memoizedDateParts.__tvltMemoized = true;
            window.getVietnamDateParts = memoizedDateParts;
        }

        // Debounce rapid search/filter input so typing does not repeatedly rebuild the UI.
        const originalFilter = window.filterSchedule;
        if (typeof originalFilter === 'function' && !originalFilter.__tvltDebounced) {
            let timer = 0;
            const debouncedFilter = () => {
                window.clearTimeout(timer);
                timer = window.setTimeout(originalFilter, 120);
            };
            debouncedFilter.__tvltDebounced = true;
            window.filterSchedule = debouncedFilter;
        }

        observeScheduleImages();

        let imageFrame = 0;
        const imageObserver = new MutationObserver(() => {
            if (imageFrame) return;
            imageFrame = requestAnimationFrame(() => {
                imageFrame = 0;
                observeScheduleImages();
            });
        });

        const calendarBody = document.getElementById('calendar-body');
        const listContainer = document.getElementById('list-container');
        if (calendarBody) imageObserver.observe(calendarBody, { childList: true, subtree: true });
        if (listContainer) imageObserver.observe(listContainer, { childList: true, subtree: true });

        const modal = document.getElementById('eventModal');
        const modalDialog = modal?.querySelector('.cc-modal-dialog');
        const closeButton = modal?.querySelector('.cc-modal-close');
        let previousFocus = null;

        if (!modal) return;

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
            const focusable = modalDialog?.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
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
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
