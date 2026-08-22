/**
 * Schedule performance + accessibility enhancements.
 * Loaded before schedule.js so the API cache can intercept the initial request.
 */
(() => {
    'use strict';

    const API_MARKER = 'script.google.com/macros/s/';
    const CACHE_KEY = 'tvlt:schedule:v3';
    const CACHE_TTL = 5 * 60 * 1000;
    const MAX_STALE_CACHE_AGE = 24 * 60 * 60 * 1000;
    const nativeFetch = window.fetch?.bind(window);

    const readCache = (allowExpired = false) => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (!cached?.time || !cached?.payload) return null;
            const age = Date.now() - cached.time;
            if (!allowExpired && age >= CACHE_TTL) return null;
            if (allowExpired && age >= MAX_STALE_CACHE_AGE) return null;
            return cached;
        } catch (_) {
            return null;
        }
    };

    const escapeMarkup = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const safeUrl = (value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return '#';
        return trimmed;
    };

    const sanitizeEventData = (payload) => {
        if (!payload || typeof payload !== 'object') return payload;
        const events = Array.isArray(payload.events) ? payload.events : Array.isArray(payload.tournaments) ? payload.tournaments : null;
        if (!events) return payload;

        return {
            ...payload,
            ...(Array.isArray(payload.events) ? { events: events.map(sanitizeEvent) } : {}),
            ...(Array.isArray(payload.tournaments) ? { tournaments: events.map(sanitizeEvent) } : {})
        };
    };

    const sanitizeEvent = (event) => {
        if (!event || typeof event !== 'object') return event;
        const copy = { ...event };
        ['eventName', 'prize', 'eventType', 'isTentative', 'organizer'].forEach((key) => {
            if (typeof copy[key] === 'string' && !['organizer'].includes(key)) copy[key] = escapeMarkup(copy[key]);
        });
        if (typeof copy.organizer === 'string' && !/^(M-DinhHoangViet|Mr\. TungJohn|Chess123-2k|VN-SenJin|FR-CH_TheClanTeamIsMine)$/.test(copy.organizer.trim())) {
            copy.organizer = copy.organizer.replace(/[<>]/g, '');
        }
        ['gameRules', 'eventRules'].forEach((key) => {
            if (typeof copy[key] === 'string') {
                copy[key] = copy[key]
                    .replace(/<\/?(script|iframe|object|embed|style)[^>]*>/gi, '')
                    .replace(/\bon\w+\s*=\s*(["']).*?\1/gi, '')
                    .replace(/\bjavascript\s*:/gi, '');
            }
        });
        ['joinLink', 'newsLink', 'bannerLink', 'logo'].forEach((key) => {
            if (typeof copy[key] === 'string') copy[key] = safeUrl(copy[key]);
        });
        return copy;
    };

    const writeCache = (payload) => {
        try {
            const safePayload = sanitizeEventData(payload);
            if (safePayload && typeof safePayload === 'object' && Array.isArray(safePayload.events || safePayload.tournaments)) {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), payload: safePayload }));
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

    if (nativeFetch) {
        window.fetch = (input, init) => {
            const url = typeof input === 'string' ? input : input?.url || '';
            if (!url.includes(API_MARKER)) return nativeFetch(input, init);

            const fresh = readCache();
            if (fresh) {
                refreshCache(input, init);
                return Promise.resolve(cacheResponse(fresh));
            }

            return nativeFetch(input, init).then(async (response) => {
                if (response.ok) {
                    const rawPayload = await response.clone().json();
                    const safePayload = sanitizeEventData(rawPayload);
                    writeCache(safePayload);
                    return new Response(JSON.stringify(safePayload), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
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

    const formatModalTime = (value) => {
        if (!value) return value;
        const match = value.match(/^(Dự kiến\s*:?\s*)?(\d{1,2})[:h](\d{2}),\s*(Thứ\s+\d|Chủ\s+Nhật)\s*-\s*ngày\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
        if (!match) return value;
        const [, tentative = '', hours, minutes, dayName, day, month, year] = match;
        return `${tentative ? 'Dự kiến ' : ''}${dayName}, ${Number(day)} thg ${Number(month)}, ${year} lúc ${hours.padStart(2, '0')}h${minutes} (UTC+7)`;
    };

    const patchScheduleHelpers = () => {
        // schedule.js is loaded after this file. Run after its DOMContentLoaded handler
        // so the global helpers exist before we wrap them.
        const originalDateParts = window.getVietnamDateParts;
        if (typeof originalDateParts === 'function' && !originalDateParts.__tvltFixedTimezone) {
            const fixedDateParts = (dateStr) => {
                if (!dateStr) return originalDateParts(dateStr);
                let formatted = String(dateStr).trim().replace(' ', 'T');
                if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(formatted)) formatted += '+07:00';
                const date = new Date(formatted);
                if (Number.isNaN(date.getTime())) return originalDateParts(dateStr);
                const offsetMatch = formatted.match(/([+-])(\d{2}):?(\d{2})$/);
                const hasExplicitOffset = Boolean(offsetMatch);
                const utcMs = date.getTime();
                const vnMs = hasExplicitOffset ? utcMs + 7 * 3600000 : utcMs;
                const vnDate = new Date(vnMs);
                return {
                    year: vnDate.getUTCFullYear(),
                    month: vnDate.getUTCMonth(),
                    date: vnDate.getUTCDate(),
                    hours: vnDate.getUTCHours(),
                    minutes: vnDate.getUTCMinutes()
                };
            };
            fixedDateParts.__tvltFixedTimezone = true;
            window.getVietnamDateParts = fixedDateParts;
        }

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
    };

    const init = () => {
        window.setTimeout(patchScheduleHelpers, 0);
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
        const modalTime = document.getElementById('modal-time');
        let previousFocus = null;
        if (!modal) return;

        if (modalTime) {
            const formatTime = () => {
                const current = modalTime.textContent.trim();
                const formatted = formatModalTime(current);
                if (formatted && formatted !== current) modalTime.textContent = formatted;
            };
            const timeObserver = new MutationObserver(formatTime);
            timeObserver.observe(modalTime, { childList: true, characterData: true, subtree: true });
            formatTime();
        }

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
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();