/**
 * Page loading progress.
 *
 * Tracks document readiness and fetch response bodies. It intentionally does not
 * follow scroll position. The public API also lets other scripts track async work:
 * TVLTProgress.begin() -> id, TVLTProgress.end(id), TVLTProgress.track(promise).
 */
(function () {
    "use strict";

    if (window.TVLTProgress) return;

    const SHOW_DELAY_MS = 150;
    const FINISH_HOLD_MS = 260;
    const FADE_DURATION_MS = 320;
    const TICK_MS = 120;
    const TASK_EASE_MS = 1400;
    const TASK_PARTIAL_CAP = 0.9;
    const MAX_UNTIL_SETTLED = 0.95;

    const tasks = new Map();
    let nextId = 1;
    let completedTasks = 0;
    let progress = 0;
    let visible = false;
    let tickTimer = null;
    let showTimer = null;
    let finishTimer = null;
    let container = null;
    let bar = null;

    function getElements() {
        if (!container) container = document.getElementById("page-progress");
        if (container && !bar) bar = container.querySelector(".page-progress-bar");
        return Boolean(container && bar);
    }

    function render() {
        if (!getElements()) return;
        const percent = Math.round(progress * 100);
        bar.style.width = percent + "%";
        container.setAttribute("aria-valuenow", String(percent));
        container.classList.toggle("is-active", visible);
        container.setAttribute("aria-hidden", visible ? "false" : "true");
    }

    function estimateProgress() {
        const pending = tasks.size;
        if (pending === 0) return 1;

        const now = performance.now();
        let partial = 0;

        tasks.forEach(function (task) {
            const eased = TASK_PARTIAL_CAP * (1 - Math.exp(-(now - task.startedAt) / TASK_EASE_MS));
            const estimate = task.fixedProgress === null
                ? eased
                : Math.max(eased * 0.5, Math.min(task.fixedProgress, TASK_PARTIAL_CAP));
            partial += estimate;
        });

        return Math.min(
            (completedTasks + partial) / (completedTasks + pending),
            MAX_UNTIL_SETTLED
        );
    }

    function tick() {
        // New requests may join a cycle, but the visible value never moves backward.
        progress = Math.max(progress, estimateProgress());
        render();
    }

    function resetCycle() {
        window.clearTimeout(finishTimer);
        finishTimer = null;
        completedTasks = 0;
        progress = 0;
        visible = false;

        if (getElements()) {
            bar.style.transition = "none";
            bar.style.width = "0%";
            void bar.offsetWidth;
            bar.style.transition = "";
        }

        render();
    }

    function startCycleIfNeeded() {
        if (tickTimer !== null) return;

        if (progress >= 1 || finishTimer !== null) resetCycle();

        tickTimer = window.setInterval(tick, TICK_MS);
        showTimer = window.setTimeout(function () {
            showTimer = null;
            visible = true;
            tick();
        }, SHOW_DELAY_MS);
    }

    function finishCycle() {
        window.clearInterval(tickTimer);
        tickTimer = null;

        if (showTimer !== null) {
            window.clearTimeout(showTimer);
            showTimer = null;
            resetCycle();
            return;
        }

        progress = 1;
        render();

        finishTimer = window.setTimeout(function () {
            visible = false;
            render();
            finishTimer = window.setTimeout(resetCycle, FADE_DURATION_MS);
        }, FINISH_HOLD_MS);
    }

    function begin(fixedProgress) {
        const id = nextId++;
        tasks.set(id, {
            startedAt: performance.now(),
            fixedProgress: typeof fixedProgress === "number" ? fixedProgress : null
        });
        startCycleIfNeeded();
        return id;
    }

    function end(id) {
        if (!tasks.delete(id)) return;

        completedTasks += 1;

        if (tasks.size === 0) finishCycle();
        else tick();
    }

    function track(promise) {
        const id = begin();
        Promise.resolve(promise).then(
            function () { end(id); },
            function () { end(id); }
        );
        return promise;
    }

    function trackResponseBody(response, id) {
        if (!response || !response.body || typeof response.body.getReader !== "function") {
            end(id);
            return;
        }

        const contentType = response.headers && response.headers.get("content-type");
        if (contentType && /text\/event-stream/i.test(contentType)) {
            end(id);
            return;
        }

        let reader;
        try {
            // Read a clone so the caller can still consume the original Response.
            const clone = response.clone();
            if (!clone.body || typeof clone.body.getReader !== "function") {
                end(id);
                return;
            }
            reader = clone.body.getReader();
        } catch (error) {
            // If cloning is unsupported or the body is already locked, at least
            // account for the request until response headers have arrived.
            end(id);
            return;
        }

        (async function consumeBody() {
            try {
                while (true) {
                    const result = await reader.read();
                    if (result.done) break;
                }
            } catch (error) {
                // Aborts and stream failures still settle the loading task.
            } finally {
                try { reader.releaseLock(); } catch (error) { /* already released */ }
                end(id);
            }
        })();
    }

    // --- Fetch requests: wait for response bytes, not only response headers. ---
    const nativeFetch = window.fetch;
    if (typeof nativeFetch === "function") {
        window.fetch = function () {
            const id = begin();
            let request;

            try {
                request = nativeFetch.apply(this, arguments);
            } catch (error) {
                end(id);
                throw error;
            }

            Promise.resolve(request).then(
                function (response) { trackResponseBody(response, id); },
                function () { end(id); }
            );

            return request;
        };
    }

    // --- Document readiness: use real browser milestones. ---
    if (document.readyState !== "complete") {
        const pageTask = begin(0.25);
        const stages = { loading: 0.25, interactive: 0.65 };

        function updateDocumentProgress() {
            if (document.readyState === "complete") {
                end(pageTask);
                document.removeEventListener("readystatechange", updateDocumentProgress);
                return;
            }

            const task = tasks.get(pageTask);
            if (task) task.fixedProgress = stages[document.readyState] || task.fixedProgress;
        }

        document.addEventListener("readystatechange", updateDocumentProgress);
        window.addEventListener("load", function () { end(pageTask); }, { once: true });
    }

    window.TVLTProgress = {
        begin: begin,
        end: end,
        track: track
    };
})();
