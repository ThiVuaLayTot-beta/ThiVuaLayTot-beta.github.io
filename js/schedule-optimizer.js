/* Schedule data optimization layer. Loaded after schedule.js. */
(() => {
    const CACHE_KEY = 'tvlt:schedule:v2';
    const CACHE_TTL = 5 * 60 * 1000;
    const originalDateParts = window.getVietnamDateParts;
    const dateCache = new Map();

    if (typeof originalDateParts === 'function') {
        window.getVietnamDateParts = function cachedVietnamDateParts(dateStr) {
            if (!dateStr) return originalDateParts(dateStr);
            const key = String(dateStr);
            const cached = dateCache.get(key);
            if (cached) return cached;
            const parts = originalDateParts(key);
            dateCache.set(key, parts);
            return parts;
        };
    }

    function readCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (!cached || !Array.isArray(cached.events) || Date.now() - cached.time > CACHE_TTL) return null;
            return cached.events;
        } catch (_) {
            return null;
        }
    }

    function writeCache(events) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), events }));
        } catch (_) {
            // Storage can be disabled or full; the live API remains the source of truth.
        }
    }

    // Cache only successful API data. The original loader remains responsible for UI/error handling.
    const originalFetch = window.fetch;
    if (typeof originalFetch === 'function') {
        window.fetch = function optimizedFetch(input, init) {
            const url = typeof input === 'string' ? input : input?.url;
            if (url && url.includes('script.google.com/macros/s/')) {
                return originalFetch.call(this, input, init).then(response => {
                    if (!response.ok) return response;
                    const clone = response.clone();
                    clone.text().then(text => {
                        try {
                            const data = JSON.parse(text);
                            const events = data.events || data.tournaments;
                            if (Array.isArray(events)) writeCache(events);
                        } catch (_) { /* Keep live response untouched. */ }
                    });
                    return response;
                });
            }
            return originalFetch.call(this, input, init);
        };
    }

    // Warm the page from a recent cache before the live request completes.
    // This is intentionally conservative: only populate the global array when the page has no data yet.
    document.addEventListener('DOMContentLoaded', () => {
        const cachedEvents = readCache();
        if (!cachedEvents || !Array.isArray(window.tournaments) || window.tournaments.length) return;
        window.tournaments = cachedEvents;
    }, { once: true });
})();
