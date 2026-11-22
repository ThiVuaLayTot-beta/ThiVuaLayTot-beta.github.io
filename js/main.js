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

/** 
 * Main site navigation
 */
const menuBtn = document.getElementById("mobile-menu-btn");
const mobileNav = document.getElementById("mobile-nav-menu");
const dropdowns = document.querySelectorAll(".section.dropdown");

// Handle image fallbacks without inline HTML event attributes.
document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.fallbackSrc ||
        image.dataset.fallbackAttempted === "true") return;
    image.dataset.fallbackAttempted = "true";
    image.src = image.dataset.fallbackSrc;
}, true);
const isMobileNav = () => window.matchMedia("(max-width: 1024px)").matches;
let dropdownCloseTimer = null;

function cancelDropdownClose() {
    if (dropdownCloseTimer !== null) {
        window.clearTimeout(dropdownCloseTimer);
        dropdownCloseTimer = null;
    }
}

function setDropdownState(dropdown, open) {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    dropdown.classList.toggle("active", open);
    if (trigger) trigger.setAttribute("aria-expanded", String(open));
    if (open) delete dropdown.dataset.escapeClosed;
}

function closeDropdowns() {
    cancelDropdownClose();
    dropdowns.forEach(dropdown => setDropdownState(dropdown, false));
}

function closeMobileNav({ restoreFocus = false } = {}) {
    if (!mobileNav || !menuBtn) return;

    mobileNav.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Mở menu điều hướng");
    document.documentElement.classList.remove("nav-open");
    document.body.classList.remove("nav-open");
    closeDropdowns();

    const menuIcon = document.getElementById("mobile-menu-icon");
    if (menuIcon) {
        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    }

    if (restoreFocus) menuBtn.focus();
}

function openMobileNav() {
    if (!mobileNav || !menuBtn) return;

    mobileNav.classList.add("active");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Đóng menu điều hướng");
    document.documentElement.classList.add("nav-open");
    document.body.classList.add("nav-open");

    const menuIcon = document.getElementById("mobile-menu-icon");
    if (menuIcon) {
        menuIcon.classList.remove("bx-menu");
        menuIcon.classList.add("bx-x");
    }
}

if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        if (!mobileNav || !isMobileNav()) return;

        if (mobileNav.classList.contains("active")) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    });
}

dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", event => {
        event.preventDefault();

        const shouldOpen = !dropdown.classList.contains("active");

        closeDropdowns();
        setDropdownState(dropdown, shouldOpen);

        if (!shouldOpen && !isMobileNav()) {
            dropdown.dataset.escapeClosed = "true";
            trigger.blur();
        }
    });

    dropdown.addEventListener("pointerenter", () => {
        if (isMobileNav()) return;

        closeDropdowns();
        if (dropdown.dataset.escapeClosed !== "true") {
            setDropdownState(dropdown, true);
        }
    });

    dropdown.addEventListener("pointerleave", () => {
        if (isMobileNav()) return;

        cancelDropdownClose();
        dropdownCloseTimer = window.setTimeout(() => {
            dropdownCloseTimer = null;

            if (!dropdown.matches(":hover") && !dropdown.contains(document.activeElement)) {
                delete dropdown.dataset.escapeClosed;
                setDropdownState(dropdown, false);
            }
        }, 160);
    });

    dropdown.addEventListener("focusin", () => {
        if (isMobileNav()) return;

        closeDropdowns();
        if (dropdown.dataset.escapeClosed !== "true") {
            setDropdownState(dropdown, true);
        }
    });

    dropdown.addEventListener("focusout", event => {
        if (isMobileNav() || dropdown.contains(event.relatedTarget)) return;

        cancelDropdownClose();
        dropdownCloseTimer = window.setTimeout(() => {
            dropdownCloseTimer = null;

            if (!dropdown.contains(document.activeElement) && !dropdown.matches(":hover")) {
                delete dropdown.dataset.escapeClosed;
                setDropdownState(dropdown, false);
            }
        }, 100);
    });
});

document.addEventListener("click", event => {
    if (isMobileNav() && mobileNav?.classList.contains("active")) {
        if (mobileNav.contains(event.target) || menuBtn?.contains(event.target)) return;
        closeMobileNav();
        return;
    }

    if (!Array.from(dropdowns).some(dropdown => dropdown.contains(event.target))) {
        closeDropdowns();
    }
});

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    const openDropdown = Array.from(dropdowns)
        .find(dropdown => dropdown.classList.contains("active"));

    if (openDropdown) {
        const trigger = openDropdown.querySelector(".dropdown-trigger");
        setDropdownState(openDropdown, false);
        openDropdown.dataset.escapeClosed = "true";
        trigger?.focus();
        return;
    }

    if (mobileNav?.classList.contains("active")) {
        closeMobileNav({ restoreFocus: true });
    }
});

let lastViewportWidth = window.innerWidth;
window.addEventListener("resize", () => {
    // Mobile browsers fire "resize" when the URL bar shows/hides while scrolling;
    // only react to real width changes so open menus are not closed mid-scroll.
    if (window.innerWidth === lastViewportWidth) return;
    lastViewportWidth = window.innerWidth;
    closeDropdowns();
    if (!isMobileNav()) closeMobileNav();
});

if (mobileNav) {
    mobileNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            if (isMobileNav()) closeMobileNav();
        });
    });
}

function normalizePath(path) {
    const normalized = path.replace(/\/+$/, "");
    return normalized || "/";
}

function markCurrentRoute() {
    if (!mobileNav) return;

    const currentPath = normalizePath(window.location.pathname.toLowerCase());
    const currentHash = window.location.hash;
    const links = Array.from(
        document.querySelectorAll(".page-header .nav-link, .page-header .dropdown-menu a")
    );

    links.forEach(link => {
        link.classList.remove("nav-link--active");
        link.removeAttribute("aria-current");
    });
    dropdowns.forEach(dropdown => dropdown.classList.remove("has-current"));

    const candidates = links.filter(link => {
        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin) return false;

        const linkPath = normalizePath(url.pathname.toLowerCase());
        if (url.hash && url.hash !== currentHash) return false;
        if (linkPath === "/" && currentPath !== "/") return false;

        return currentPath === linkPath ||
            (linkPath !== "/" && currentPath.startsWith(linkPath + "/"));
    });

    candidates.sort((a, b) => {
        const urlA = new URL(a.href, window.location.origin);
        const urlB = new URL(b.href, window.location.origin);
        const scoreA = normalizePath(urlA.pathname).length +
            (urlA.hash && urlA.hash === currentHash ? 10000 : 0);
        const scoreB = normalizePath(urlB.pathname).length +
            (urlB.hash && urlB.hash === currentHash ? 10000 : 0);
        return scoreB - scoreA;
    });

    const activeLink = candidates[0];
    if (!activeLink) return;

    activeLink.classList.add("nav-link--active");
    activeLink.setAttribute("aria-current", "page");
    activeLink.closest(".section.dropdown")?.classList.add("has-current");
}

markCurrentRoute();


/**
 * Page Load Events
 */
window.addEventListener("load", function() {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.remove("show");
    handleScrollEffects();
});

/**
 * Scroll Events and Performance Optimization
 */
const backToTopBtn = document.getElementById("back-to-top");
const timeline = document.querySelector('.timeline');
const timelineItems = document.querySelectorAll('[data-timeline-item]');

if (timelineItems.length) {
    if ('IntersectionObserver' in window) {
        const timelineObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18 });

        timelineItems.forEach(item => timelineObserver.observe(item));
    } else {
        timelineItems.forEach(item => item.classList.add('is-visible'));
    }
}

let isScrolling = false;

window.addEventListener("scroll", () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            handleScrollEffects();
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

/**
 * Handles scroll-based UI updates
 */
function handleScrollEffects() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (backToTopBtn) if(scrollTop > 100) { backToTopBtn.classList.add("show"); } else { backToTopBtn.classList.remove("show"); }

    if (timeline) {
        const rect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
            const start = rect.top;
            const end = rect.bottom;
            const current = windowHeight * 0.7;
            let scrollPercent = ((current - start) / (end - start)) * 100;
            scrollPercent = Math.min(Math.max(scrollPercent, 0), 100);
            timeline.style.setProperty('--timeline-progress', scrollPercent + '%');
        }
    }
}

/**
 * Back to Top Button
 */
if (backToTopBtn) {
    backToTopBtn.addEventListener("click", function() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    });
}

/** Normalize Vietnamese text once for the entire site. */
function removeVietnameseTones(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, (character) => (character === "đ" ? "d" : "D"))
        .toLowerCase()
        .trim();
}
window.removeVietnameseTones = removeVietnameseTones;

/** Global search dialog with request de-duplication and race-free first results. */
function initializeGlobalSearch() {
    const trigger = document.getElementById("open-search-btn");
    if (!trigger || document.getElementById("search-modal")) return;

    document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div id="search-modal" class="search-modal-overlay" aria-hidden="true">
            <section class="search-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
                <div class="search-modal-header">
                    <span class="bx bx-search search-icon" aria-hidden="true"></span>
                    <div class="search-modal-field">
                        <label id="global-search-title" class="visually-hidden" for="global-search-input">Tìm kiếm trên website</label>
                        <input type="search" id="global-search-input" placeholder="Tìm kiếm bài viết, giải đấu..." autocomplete="off">
                        <small>Ctrl+K để mở · Esc để đóng</small>
                    </div>
                    <button type="button" id="close-search-modal" class="close-search-btn" aria-label="Đóng tìm kiếm"><span class="bx bx-x" aria-hidden="true"></span></button>
                </div>
                <p id="global-search-status" class="visually-hidden" role="status" aria-live="polite"></p>
                <div id="global-search-results" class="search-modal-results" role="list" aria-label="Kết quả tìm kiếm"></div>
            </section>
        </div>`,
    );

    const modal = document.getElementById("search-modal");
    const closeButton = document.getElementById("close-search-modal");
    const input = document.getElementById("global-search-input");
    const results = document.getElementById("global-search-results");
    const statusEl = document.getElementById("global-search-status");
    if (!modal || !closeButton || !input || !results) return;

    let searchTimer = null;
    let index = [];
    let indexReady = false;
    let indexPromise = null;
    let previousOverflow = "";

    function showMessage(message) {
        results.textContent = "";
        const p = document.createElement("p");
        p.className = "search-no-results";
        p.textContent = message;
        results.appendChild(p);
        if (statusEl) statusEl.textContent = message;
    }
    function renderResults(query) {
        const normalized = removeVietnameseTones(query);
        results.textContent = "";
        if (!normalized) {
            showMessage(
                indexReady
                    ? "Nhập từ khóa để tìm bài viết, giải đấu và các trang của CLB."
                    : "Đang tải dữ liệu tìm kiếm…",
            );
            return;
        }
        if (!indexReady) {
            showMessage("Đang tải dữ liệu tìm kiếm…");
            return;
        }
        const terms = normalized.split(/\s+/);
        const hasAll = (text) => terms.every((term) => text.includes(term));
        const matches = index
            .map((item) => {
                // normalise each field once (not on every keystroke)
                const text = item.normalized;
                let score = 0;
                if (text.title.startsWith(normalized)) score += 5;
                else if (hasAll(text.title)) score += 4;
                if (hasAll(text.summary)) score += 2;
                if (hasAll(text.content)) score += 1;
                if (hasAll(text.tags) || hasAll(text.category)) score += 2;
                return { item, score };
            })
            .filter((result) => result.score > 0)
            .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "vi"))
            .slice(0, 15);
        if (!matches.length) {
            showMessage("Không tìm thấy kết quả phù hợp.");
            return;
        }
        if (statusEl) statusEl.textContent = `${matches.length} kết quả phù hợp.`;
        matches.forEach(({ item }) => {
            const row = document.createElement("div");
            row.setAttribute("role", "listitem");
            const link = document.createElement("a");
            link.className = "search-result-item";
            link.href = item.link;
            const title = document.createElement("h4");
            title.textContent = item.title;
            const summary = document.createElement("p");
            const description = item.summary || item.content || "";
            summary.textContent = description.length > 140 ? description.slice(0, 137) + "…" : description;
            link.append(title, summary);
            row.appendChild(link);
            results.appendChild(row);
        });
    }
    function loadIndex() {
        if (indexReady) {
            renderResults(input.value);
            return Promise.resolve(index);
        }
        if (indexPromise) return indexPromise;
        indexPromise = fetch("/search.json", { headers: { Accept: "application/json" } })
            .then((response) => {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then((entries) => {
                if (!Array.isArray(entries)) throw new Error("Chỉ mục tìm kiếm không hợp lệ.");
                const posts = entries
                    .map((entry) => ({
                        title: String(entry.title || "").trim(),
                        link: String(entry.url || entry.link || "").trim(),
                        summary: String(entry.summary || ""),
                        content: String(entry.content || ""),
                        category: String(entry.category || ""),
                        tags: Array.isArray(entry.tags) ? entry.tags.map(String).join(" ") : String(entry.tags || ""),
                    }))
                    .filter((item) => item.title && item.link);
                // Normalize every searchable field once when Jekyll's index is loaded.
                index = posts.map((item) => ({
                    ...item,
                    normalized: {
                        title: removeVietnameseTones(item.title),
                        summary: removeVietnameseTones(item.summary),
                        content: removeVietnameseTones(item.content),
                        category: removeVietnameseTones(item.category),
                        tags: removeVietnameseTones(item.tags),
                    },
                }));
                indexReady = true;
                renderResults(input.value);
                return index;
            })
            .catch((error) => {
                console.error("Không thể tải chỉ mục tìm kiếm:", error);
                indexPromise = null;
                showMessage("Không thể tải dữ liệu tìm kiếm. Hãy thử lại.");
                return [];
            });
        return indexPromise;
    }
    function openModal() {
        if (mobileNav?.classList.contains("active")) closeMobileNav();
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        input.focus();
        loadIndex();
    }
    function closeModal() {
        window.clearTimeout(searchTimer);
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = previousOverflow;
        input.value = "";
        results.textContent = "";
        if (statusEl) statusEl.textContent = "";
        trigger.focus();
    }
    trigger.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    input.addEventListener("input", (event) => {
        window.clearTimeout(searchTimer);
        const query = event.target.value;
        searchTimer = window.setTimeout(() => renderResults(query), 140);
    });
    input.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown") return;
        const firstResult = results.querySelector(".search-result-item");
        if (!firstResult) return;
        event.preventDefault();
        firstResult.focus();
    });
    results.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const links = Array.from(results.querySelectorAll(".search-result-item"));
        const current = links.indexOf(document.activeElement);
        const next = event.key === "ArrowDown" ? Math.min(current + 1, links.length - 1) : current - 1;
        event.preventDefault();
        if (next < 0) input.focus();
        else links[next]?.focus();
    });
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
    modal.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const focusable = Array.from(
            modal.querySelectorAll("button:not([disabled]),input:not([disabled]),a[href]"),
        ).filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0],
            last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    document.addEventListener("keydown", (event) => {
        const target = event.target;
        const isEditingOutsideSearch = target instanceof HTMLElement &&
            !modal.contains(target) &&
            (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

        if (
            (event.ctrlKey || event.metaKey) &&
            !event.altKey &&
            !event.shiftKey &&
            event.key.toLowerCase() === "k"
        ) {
            if (isEditingOutsideSearch) return;
            event.preventDefault();
            if (modal.classList.contains("active")) closeModal();
            else openModal();
        } else if (event.key === "Escape" && modal.classList.contains("active")) {
            event.preventDefault();
            closeModal();
        }
    });
}

/** Copy text with a fallback for browsers without the Clipboard API. */
async function copyTextToClipboard(value) {
    const text = String(value ?? "");
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Trình duyệt không hỗ trợ sao chép.");
}
function showCopiedState(button, originalText) {
    button.textContent = "Đã sao chép";
    button.classList.add("is-copied");
    window.setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("is-copied");
    }, 1600);
}

/** Reading time, automatic TOC, page-link and tournament/code copy actions. */
function showReadingTime(article) {
    const wordCount = (article.textContent || "").trim().split(/\s+/).filter(Boolean).length;
    const badge = document.querySelector(".reading-time");
    if (badge) badge.textContent = `${Math.max(1, Math.ceil(wordCount / 200))} phút đọc`;
}

function buildTableOfContents(article) {
    const headings = Array.from(article.querySelectorAll("h2,h3"));
    if (headings.length >= 2 && !article.querySelector("#post-toc")) {
        const toc = document.createElement("nav");
        toc.id = "post-toc";
        toc.className = "post-toc";
        toc.setAttribute("aria-label", "Mục lục bài viết");
        const label = document.createElement("strong");
        label.textContent = "Mục lục";
        const list = document.createElement("ol");
        const used = new Set();
        headings.forEach((heading, index) => {
            let base =
                heading.id ||
                removeVietnameseTones(heading.textContent)
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
            if (!base) base = "muc-" + (index + 1);
            let id = base,
                suffix = 2;
            while (used.has(id) || (document.getElementById(id) && heading.id !== id))
                id = base + "-" + suffix++;
            used.add(id);
            heading.id = id;
            const li = document.createElement("li");
            if (heading.tagName === "H3") li.classList.add("post-toc__subitem");
            const link = document.createElement("a");
            link.href = "#" + id;
            link.textContent = heading.textContent.trim();
            li.appendChild(link);
            list.appendChild(li);
        });
        toc.append(label, list);
        article.insertBefore(toc, article.firstChild);
    }
}

function addCopyButtons(article) {
    const copyPage = document.getElementById("copy-page-link");
    if (copyPage && copyPage.dataset.initialized !== "true") {
        copyPage.dataset.initialized = "true";
        copyPage.addEventListener("click", async () => {
            const original = copyPage.textContent.trim();
            try {
                await copyTextToClipboard(window.location.href);
                showCopiedState(copyPage, original);
            } catch (error) {
                console.error(error);
                copyPage.textContent = "Không sao chép được";
            }
        });
    }
    article.querySelectorAll("pre").forEach((pre) => {
        if (pre.querySelector(".copy-code-btn")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "copy-code-btn";
        button.textContent = "Sao chép mã";
        button.addEventListener("click", async () => {
            try {
                await copyTextToClipboard(pre.querySelector("code")?.textContent || pre.textContent);
                showCopiedState(button, "Sao chép mã");
            } catch (error) {
                console.error(error);
                button.textContent = "Lỗi sao chép";
            }
        });
        pre.appendChild(button);
    });
    article.querySelectorAll(".tournament-code,[data-tournament-code]").forEach((element) => {
        if (element.dataset.copyButtonAdded === "true") return;
        element.dataset.copyButtonAdded = "true";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "copy-code-btn copy-code-btn--inline";
        button.textContent = "Sao chép mã";
        button.addEventListener("click", async () => {
            const code = element.dataset.tournamentCode || element.textContent.trim();
            try {
                await copyTextToClipboard(code);
                showCopiedState(button, "Sao chép mã");
            } catch (error) {
                console.error(error);
                button.textContent = "Lỗi sao chép";
            }
        });
        element.insertAdjacentElement("afterend", button);
    });
}

function initializeReadingUtilities() {
    const article = document.querySelector(".post-contents");
    if (!article) return;
    showReadingTime(article);
    buildTableOfContents(article);
    addCopyButtons(article);
}

/** Respect reduced motion while enhancing only visible homepage elements. */
function initHomeInteractiveEffects() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!reduceMotion && finePointer) {
        document
            .querySelectorAll(".event-card,.post-card,.partner-item")
            .forEach((card) => {
                card.addEventListener("pointermove", (event) => {
                    const rect = card.getBoundingClientRect();
                    card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
                    card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
                });
            });
    }
    const items = document.querySelectorAll(".reveal-on-scroll,[data-reveal]");
    if (!items.length) return;
    if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !("IntersectionObserver" in window)
    ) {
        items.forEach((item) => item.classList.add("is-visible"));
        return;
    }
    const observer = new IntersectionObserver(
        (entries, currentObserver) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    currentObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 },
    );
    items.forEach((item) => observer.observe(item));
}
function initializeSharedPageFeatures() {
    initializeGlobalSearch();
    initializeReadingUtilities();
    initHomeInteractiveEffects();
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initializeSharedPageFeatures, { once: true });
else initializeSharedPageFeatures();
function initSubpageInteractiveEffects() {
    const cards = document.querySelectorAll(
        ".list-item-people, .category-card, .social-card, .social-card-group, .social-link-item, .contact-card, .contact-method, .contact-donation, .video-card, .card-list .card, .about-card, .tournament-card, .event-winner-card"
    );
    if (!cards.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!reduceMotion && finePointer) {
        cards.forEach((card) => {
            card.addEventListener("pointermove", (event) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mouse-x", (event.clientX - rect.left) + "px");
                card.style.setProperty("--mouse-y", (event.clientY - rect.top) + "px");
            });
        });
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
        cards.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    cards.forEach((item) => observer.observe(item));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSubpageInteractiveEffects, { once: true });
else initSubpageInteractiveEffects();
async function initHomepageStatsSync() {
    const card = document.querySelector(".bento-card--stats");
    const ytEl = document.getElementById("stat-youtube-subs");
    const ccEl = document.getElementById("stat-chesscom-members");
    const peEl = document.getElementById("stat-prize-events");
    if (!ytEl && !ccEl && !peEl) return;

    const statsApiUrl = (card?.getAttribute("data-stats-api") || "").trim();
    // Build-time snapshot (_data/stats.json); a cache older than it must not override it.
    const builtAt = Date.parse(card?.getAttribute("data-updated-at") || "") || 0;
    const CACHE_KEY = "tvlt_homepage_stats_cache_v1";
    const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

    const setStat = (element, value) => {
        if (!element || !value) return;
        element.dataset.finalValue = value; // lets home.js count-up end on the fresh value
        element.textContent = value;
    };
    const applyStats = (stats) => {
        if (!stats) return;
        setStat(ytEl, stats.youtubeSubs);
        setStat(ccEl, stats.chesscomMembers);
        setStat(peEl, stats.prizeEvents);
    };
    const saveCache = (value) => {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch (error) { /* storage unavailable */ }
    };

    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        const isFresh = cached && Date.now() - cached.updatedAt < CACHE_TTL_MS && cached.updatedAt > builtAt;
        if (isFresh) {
            const usable = statsApiUrl
                ? cached.source === "apps-script" && (cached.youtubeSubs || cached.chesscomMembers || cached.prizeEvents)
                : cached.chesscomMembers;
            if (usable) {
                applyStats(cached);
                return;
            }
        }
    } catch (error) { /* ignore corrupt cache */ }

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
        } catch (error) { /* fall through to Chess.com */ }
    }

    if (!ccEl) return;
    try {
        const response = await fetch("https://api.chess.com/pub/club/thi-vua-lay-tot-tungjohn-playing-chess");
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.members_count === "number" && data.members_count > 0) {
            const formatted = data.members_count >= 1000 ? `${Math.floor(data.members_count / 1000)}K+` : String(data.members_count);
            setStat(ccEl, formatted);
            saveCache({ chesscomMembers: formatted, source: "chesscom-api", updatedAt: Date.now() });
        }
    } catch (error) { /* keep build-time value */ }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initHomepageStatsSync, { once: true });
else initHomepageStatsSync();