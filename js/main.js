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
    // Giá trị đã vẽ gần nhất, để tick 120ms không ghi lại DOM khi chưa có gì đổi.
    let renderedPercent = -1;
    let renderedVisible = null;

    function getElements() {
        if (!container) container = document.getElementById("page-progress");
        if (container && !bar) bar = container.querySelector(".page-progress-bar");
        return Boolean(container && bar);
    }

    function render() {
        if (!getElements()) return;
        const percent = Math.round(progress * 100);
        if (percent !== renderedPercent) {
            bar.style.width = percent + "%";
            container.setAttribute("aria-valuenow", String(percent));
            renderedPercent = percent;
        }
        if (visible !== renderedVisible) {
            container.classList.toggle("is-active", visible);
            container.setAttribute("aria-hidden", visible ? "false" : "true");
            renderedVisible = visible;
        }
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

        renderedPercent = -1;
        renderedVisible = null;
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
 * Phần còn lại của main.js: các tính năng dùng chung cho mọi trang.
 *
 *  1. Tiện ích (chuẩn hoá tiếng Việt, ảnh dự phòng, hiện dần khi cuộn tới)
 *  2. Điều hướng (menu mobile, dropdown, đánh dấu trang hiện tại)
 *  3. Cuộn trang (nút lên đầu, timeline)
 *  4. Tìm kiếm toàn site (Ctrl+K)
 *  5. Tiện ích đọc bài (thời gian đọc, mục lục, nút sao chép)
 *  6. Hiệu ứng thẻ (ánh sáng theo con trỏ, hiện dần)
 *
 * Số liệu thống kê trang chủ do home.js xử lý. Toàn bộ nằm trong IIFE; chỉ
 * window.removeVietnameseTones được công khai (schedule.js, category-filter.js dùng).
 */
(() => {
"use strict";

/* ============================ 1. Tiện ích ============================ */

const byId = (id) => document.getElementById(id);
const mobileNavQuery = window.matchMedia("(max-width: 1024px)");
const isMobileNav = () => mobileNavQuery.matches;

/** Chuẩn hoá văn bản tiếng Việt (bỏ dấu, thường hoá) dùng chung cho cả site. */
function removeVietnameseTones(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, (character) => (character === "đ" ? "d" : "D"))
        .toLowerCase()
        .trim();
}
window.removeVietnameseTones = removeVietnameseTones;

/**
 * Ảnh lỗi -> data-fallback-src (mỗi ảnh thử một lần). Sự kiện "error" của ảnh không
 * nổi bọt nên phải nghe ở pha capture; gắn ngay để bắt cả ảnh lỗi trước khi DOM xong.
 */
document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.fallbackSrc ||
        image.dataset.fallbackAttempted === "true") return;
    image.dataset.fallbackAttempted = "true";
    image.src = image.dataset.fallbackSrc;
}, true);

function onReady(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
    else callback();
}

/** Thêm class `is-visible` khi phần tử vào khung nhìn (một IntersectionObserver cho mỗi ngưỡng). */
const visibilityObservers = new Map();
function revealWhenVisible(elements, threshold) {
    if (!elements.length) return;
    if (!("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    let observer = visibilityObservers.get(threshold);
    if (!observer) {
        observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            });
        }, { threshold });
        visibilityObservers.set(threshold, observer);
    }
    elements.forEach((element) => observer.observe(element));
}

/* ============================ 2. Điều hướng ============================ */

const DROPDOWN_POINTER_CLOSE_DELAY_MS = 160;
const DROPDOWN_FOCUS_CLOSE_DELAY_MS = 100;

function initializeNavigation() {
    const menuButton = byId("mobile-menu-btn");
    const mobileNav = byId("mobile-nav-menu");
    const menuIcon = byId("mobile-menu-icon");
    const dropdowns = Array.from(document.querySelectorAll(".section.dropdown"));
    let closeTimer = 0;

    function cancelDropdownClose() {
        if (!closeTimer) return;
        window.clearTimeout(closeTimer);
        closeTimer = 0;
    }

    function setDropdownState(dropdown, open) {
        const trigger = dropdown.querySelector(".dropdown-trigger");
        dropdown.classList.toggle("active", open);
        if (trigger) trigger.setAttribute("aria-expanded", String(open));
        if (open) delete dropdown.dataset.escapeClosed;
    }

    function closeDropdowns() {
        cancelDropdownClose();
        dropdowns.forEach((dropdown) => setDropdownState(dropdown, false));
    }

    function setMobileNavOpen(open) {
        mobileNav.classList.toggle("active", open);
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "Đóng menu điều hướng" : "Mở menu điều hướng");
        document.documentElement.classList.toggle("nav-open", open);
        document.body.classList.toggle("nav-open", open);
        if (!open) closeDropdowns();
        if (menuIcon) {
            menuIcon.classList.toggle("bx-x", open);
            menuIcon.classList.toggle("bx-menu", !open);
        }
    }

    function closeMobileNav({ restoreFocus = false } = {}) {
        if (!mobileNav || !menuButton) return;
        setMobileNavOpen(false);
        if (restoreFocus) menuButton.focus();
    }

    menuButton?.addEventListener("click", () => {
        if (!mobileNav || !isMobileNav()) return;
        setMobileNavOpen(!mobileNav.classList.contains("active"));
    });

    // Đóng dropdown sau một khoảng trễ nếu con trỏ/focus đã rời khỏi nó.
    function scheduleDropdownClose(dropdown, delay) {
        cancelDropdownClose();
        closeTimer = window.setTimeout(() => {
            closeTimer = 0;
            if (!dropdown.matches(":hover") && !dropdown.contains(document.activeElement)) {
                delete dropdown.dataset.escapeClosed;
                setDropdownState(dropdown, false);
            }
        }, delay);
    }

    // Trên desktop: mở khi trỏ/focus vào, trừ khi người dùng vừa chủ động đóng bằng Esc/click.
    function openDropdownOnDesktop(dropdown) {
        if (isMobileNav()) return;
        closeDropdowns();
        if (dropdown.dataset.escapeClosed !== "true") setDropdownState(dropdown, true);
    }

    dropdowns.forEach((dropdown) => {
        const trigger = dropdown.querySelector(".dropdown-trigger");
        if (!trigger) return;

        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            const shouldOpen = !dropdown.classList.contains("active");

            closeDropdowns();
            setDropdownState(dropdown, shouldOpen);

            if (!shouldOpen && !isMobileNav()) {
                dropdown.dataset.escapeClosed = "true";
                trigger.blur();
            }
        });

        dropdown.addEventListener("pointerenter", () => openDropdownOnDesktop(dropdown));
        dropdown.addEventListener("focusin", () => openDropdownOnDesktop(dropdown));
        dropdown.addEventListener("pointerleave", () => {
            if (!isMobileNav()) scheduleDropdownClose(dropdown, DROPDOWN_POINTER_CLOSE_DELAY_MS);
        });
        dropdown.addEventListener("focusout", (event) => {
            if (isMobileNav() || dropdown.contains(event.relatedTarget)) return;
            scheduleDropdownClose(dropdown, DROPDOWN_FOCUS_CLOSE_DELAY_MS);
        });
    });

    document.addEventListener("click", (event) => {
        if (isMobileNav() && mobileNav?.classList.contains("active")) {
            if (mobileNav.contains(event.target) || menuButton?.contains(event.target)) return;
            closeMobileNav();
            return;
        }
        if (!dropdowns.some((dropdown) => dropdown.contains(event.target))) closeDropdowns();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        const openDropdown = dropdowns.find((dropdown) => dropdown.classList.contains("active"));
        if (openDropdown) {
            setDropdownState(openDropdown, false);
            openDropdown.dataset.escapeClosed = "true";
            openDropdown.querySelector(".dropdown-trigger")?.focus();
            return;
        }
        if (mobileNav?.classList.contains("active")) closeMobileNav({ restoreFocus: true });
    });

    let lastViewportWidth = window.innerWidth;
    window.addEventListener("resize", () => {
        // Trình duyệt mobile bắn "resize" khi thanh địa chỉ ẩn/hiện lúc cuộn;
        // chỉ phản ứng khi chiều rộng thật sự đổi để không đóng menu giữa chừng.
        if (window.innerWidth === lastViewportWidth) return;
        lastViewportWidth = window.innerWidth;
        closeDropdowns();
        if (!isMobileNav()) closeMobileNav();
    });

    mobileNav?.addEventListener("click", (event) => {
        if (event.target.closest("a") && isMobileNav()) closeMobileNav();
    });

    markCurrentRoute(mobileNav, dropdowns);
    return { mobileNav, closeMobileNav };
}

function normalizePath(path) {
    return path.replace(/\/+$/, "") || "/";
}

/** Đánh dấu liên kết điều hướng khớp trang hiện tại (đường dẫn dài nhất; ưu tiên khớp #hash). */
function markCurrentRoute(mobileNav, dropdowns) {
    if (!mobileNav) return;

    const currentPath = normalizePath(window.location.pathname.toLowerCase());
    const currentHash = window.location.hash;
    const links = Array.from(document.querySelectorAll(".page-header .nav-link, .page-header .dropdown-menu a"));

    links.forEach((link) => {
        link.classList.remove("nav-link--active");
        link.removeAttribute("aria-current");
    });
    dropdowns.forEach((dropdown) => dropdown.classList.remove("has-current"));

    const candidates = links
        .map((link) => ({ link, url: new URL(link.href, window.location.origin) }))
        .filter(({ url }) => {
            if (url.origin !== window.location.origin) return false;

            const linkPath = normalizePath(url.pathname.toLowerCase());
            if (url.hash && url.hash !== currentHash) return false;
            if (linkPath === "/" && currentPath !== "/") return false;

            return currentPath === linkPath || (linkPath !== "/" && currentPath.startsWith(linkPath + "/"));
        })
        .map((candidate) => ({
            ...candidate,
            score: normalizePath(candidate.url.pathname).length +
                (candidate.url.hash && candidate.url.hash === currentHash ? 10000 : 0)
        }))
        .sort((a, b) => b.score - a.score);

    const activeLink = candidates[0]?.link;
    if (!activeLink) return;

    activeLink.classList.add("nav-link--active");
    activeLink.setAttribute("aria-current", "page");
    activeLink.closest(".section.dropdown")?.classList.add("has-current");
}

/* ============================ 3. Cuộn trang ============================ */

const BACK_TO_TOP_THRESHOLD_PX = 100;
const TIMELINE_ANCHOR_RATIO = 0.7;
const TIMELINE_ITEM_VISIBLE_THRESHOLD = 0.18;

function initializeScrollEffects() {
    const backToTop = byId("back-to-top");
    const timeline = document.querySelector(".timeline");
    let backToTopShown = false;
    let lastTimelineProgress = "";

    function handleScrollEffects() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        const shouldShow = scrollTop > BACK_TO_TOP_THRESHOLD_PX;
        if (backToTop && shouldShow !== backToTopShown) {
            backToTopShown = shouldShow;
            backToTop.classList.toggle("show", shouldShow);
        }

        if (!timeline) return;
        const rect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top >= windowHeight || rect.bottom <= 0) return;

        const percent = ((windowHeight * TIMELINE_ANCHOR_RATIO - rect.top) / (rect.bottom - rect.top)) * 100;
        const progress = Math.min(Math.max(percent, 0), 100) + "%";
        if (progress !== lastTimelineProgress) {
            lastTimelineProgress = progress;
            timeline.style.setProperty("--timeline-progress", progress);
        }
    }

    // Gộp các sự kiện scroll thành một lần xử lý mỗi khung hình.
    let frameQueued = false;
    window.addEventListener("scroll", () => {
        if (frameQueued) return;
        frameQueued = true;
        window.requestAnimationFrame(() => {
            frameQueued = false;
            handleScrollEffects();
        });
    }, { passive: true });
    window.addEventListener("load", handleScrollEffects);

    backToTop?.addEventListener("click", () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    });

    revealWhenVisible(Array.from(document.querySelectorAll("[data-timeline-item]")), TIMELINE_ITEM_VISIBLE_THRESHOLD);
}

/* ============================ 4. Tìm kiếm toàn site ============================ */

const SEARCH_MAX_RESULTS = 15;
const SEARCH_DEBOUNCE_MS = 140;
const SEARCH_SUMMARY_MAX_CHARS = 140;
const SEARCH_MODAL_HTML = `
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
        </div>`;

/** Điểm khớp của một mục chỉ mục với truy vấn đã chuẩn hoá; 0 nghĩa là không khớp. */
function scoreSearchItem(normalizedFields, query, terms) {
    const hasAll = (text) => terms.every((term) => text.includes(term));
    let score = 0;
    if (normalizedFields.title.startsWith(query)) score += 5;
    else if (hasAll(normalizedFields.title)) score += 4;
    if (hasAll(normalizedFields.summary)) score += 2;
    if (hasAll(normalizedFields.content)) score += 1;
    if (hasAll(normalizedFields.tags) || hasAll(normalizedFields.category)) score += 2;
    return score;
}

const compareSearchMatches = (a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "vi");

/** Chèn `candidate` vào danh sách top đã sắp xếp (tìm nhị phân), giữ tối đa `limit` mục. */
function insertTopMatch(matches, candidate, limit) {
    let low = 0;
    let high = matches.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (compareSearchMatches(candidate, matches[middle]) < 0) high = middle;
        else low = middle + 1;
    }
    if (low >= limit) return;
    matches.splice(low, 0, candidate);
    if (matches.length > limit) matches.pop();
}

function parseSearchIndex(entries) {
    return entries
        .map((entry) => ({
            title: String(entry.title || "").trim(),
            link: String(entry.url || entry.link || "").trim(),
            summary: String(entry.summary || ""),
            content: String(entry.content || ""),
            category: String(entry.category || ""),
            tags: Array.isArray(entry.tags) ? entry.tags.map(String).join(" ") : String(entry.tags || "")
        }))
        .filter((item) => item.title && item.link)
        // Chuẩn hoá mọi trường tìm kiếm đúng một lần khi nạp chỉ mục của Jekyll.
        .map((item) => ({
            ...item,
            normalized: {
                title: removeVietnameseTones(item.title),
                summary: removeVietnameseTones(item.summary),
                content: removeVietnameseTones(item.content),
                category: removeVietnameseTones(item.category),
                tags: removeVietnameseTones(item.tags)
            }
        }));
}

function createSearchResultRow(item) {
    const row = document.createElement("div");
    row.setAttribute("role", "listitem");
    const link = document.createElement("a");
    link.className = "search-result-item";
    link.href = item.link;
    const title = document.createElement("h4");
    title.textContent = item.title;
    const summary = document.createElement("p");
    const description = item.summary || item.content || "";
    summary.textContent = description.length > SEARCH_SUMMARY_MAX_CHARS
        ? description.slice(0, SEARCH_SUMMARY_MAX_CHARS - 3) + "…"
        : description;
    link.append(title, summary);
    row.appendChild(link);
    return row;
}

function initializeGlobalSearch({ mobileNav, closeMobileNav }) {
    const trigger = byId("open-search-btn");
    if (!trigger || byId("search-modal")) return;

    document.body.insertAdjacentHTML("beforeend", SEARCH_MODAL_HTML);

    const modal = byId("search-modal");
    const closeButton = byId("close-search-modal");
    const input = byId("global-search-input");
    const results = byId("global-search-results");
    const statusElement = byId("global-search-status");
    if (!modal || !closeButton || !input || !results) return;

    let searchTimer = 0;
    let index = [];
    let indexReady = false;
    let indexPromise = null;
    let previousOverflow = "";

    const setStatus = (text) => {
        if (statusElement) statusElement.textContent = text;
    };

    function showMessage(message) {
        const paragraph = document.createElement("p");
        paragraph.className = "search-no-results";
        paragraph.textContent = message;
        results.replaceChildren(paragraph);
        setStatus(message);
    }

    function renderResults(query) {
        const normalized = removeVietnameseTones(query);
        if (!normalized) {
            showMessage(indexReady
                ? "Nhập từ khóa để tìm bài viết, giải đấu và các trang của CLB."
                : "Đang tải dữ liệu tìm kiếm…");
            return;
        }
        if (!indexReady) {
            showMessage("Đang tải dữ liệu tìm kiếm…");
            return;
        }

        // Giữ top-N đã sắp xếp trong lúc quét thay vì sắp xếp toàn bộ kết quả khớp.
        const terms = normalized.split(/\s+/);
        const matches = [];
        for (const item of index) {
            const score = scoreSearchItem(item.normalized, normalized, terms);
            if (score) insertTopMatch(matches, { item, score }, SEARCH_MAX_RESULTS);
        }

        if (!matches.length) {
            showMessage("Không tìm thấy kết quả phù hợp.");
            return;
        }
        setStatus(matches.length + " kết quả phù hợp.");
        const fragment = document.createDocumentFragment();
        matches.forEach(({ item }) => fragment.appendChild(createSearchResultRow(item)));
        results.replaceChildren(fragment);
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
                index = parseSearchIndex(entries);
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
        setStatus("");
        trigger.focus();
    }

    trigger.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    input.addEventListener("input", (event) => {
        window.clearTimeout(searchTimer);
        const query = event.target.value;
        searchTimer = window.setTimeout(() => renderResults(query), SEARCH_DEBOUNCE_MS);
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

    // Giữ Tab trong hộp thoại.
    modal.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const focusable = Array.from(
            modal.querySelectorAll("button:not([disabled]),input:not([disabled]),a[href]"),
        ).filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
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

    // Ctrl/Cmd+K bật/tắt tìm kiếm (trừ khi đang gõ ở ô nhập khác); Esc đóng.
    // `event.key` có thể undefined với sự kiện do autofill của trình duyệt tạo ra.
    document.addEventListener("keydown", (event) => {
        const target = event.target;
        const isEditingOutsideSearch = target instanceof HTMLElement &&
            !modal.contains(target) &&
            (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key?.toLowerCase() === "k") {
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

/* ============================ 5. Tiện ích đọc bài ============================ */

const WORDS_PER_MINUTE = 200;
const COPY_FEEDBACK_MS = 1600;

/** Sao chép văn bản; dùng execCommand khi trình duyệt không có Clipboard API. */
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

/**
 * Nút sao chép: hiện phản hồi ngắn rồi trả về nhãn gốc. Nhãn gốc được ghi nhớ
 * một lần, nên bấm liên tiếp hoặc sau lỗi không làm kẹt nhãn phản hồi.
 */
function bindCopyButton(button, getText, { errorLabel }) {
    const originalLabel = button.textContent.trim();
    let resetTimer = 0;

    const flash = (label, copied) => {
        window.clearTimeout(resetTimer);
        button.textContent = label;
        button.classList.toggle("is-copied", copied);
        resetTimer = window.setTimeout(() => {
            button.textContent = originalLabel;
            button.classList.remove("is-copied");
        }, COPY_FEEDBACK_MS);
    };

    button.addEventListener("click", async () => {
        try {
            await copyTextToClipboard(getText());
            flash("Đã sao chép", true);
        } catch (error) {
            console.error(error);
            flash(errorLabel, false);
        }
    });
}

function showReadingTime(article) {
    const wordCount = (article.textContent || "").trim().split(/\s+/).filter(Boolean).length;
    const badge = document.querySelector(".reading-time");
    if (badge) badge.textContent = `${Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))} phút đọc`;
}

function buildTableOfContents(article) {
    const headings = Array.from(article.querySelectorAll("h2,h3"));
    if (headings.length < 2 || article.querySelector("#post-toc")) return;

    const toc = document.createElement("nav");
    toc.id = "post-toc";
    toc.className = "post-toc";
    toc.setAttribute("aria-label", "Mục lục bài viết");
    const label = document.createElement("strong");
    label.textContent = "Mục lục";
    const list = document.createElement("ol");
    const usedIds = new Set();

    headings.forEach((heading, headingIndex) => {
        let base = heading.id ||
            removeVietnameseTones(heading.textContent).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!base) base = "muc-" + (headingIndex + 1);

        let id = base;
        let suffix = 2;
        while (usedIds.has(id) || (byId(id) && heading.id !== id)) id = base + "-" + suffix++;
        usedIds.add(id);
        heading.id = id;

        const item = document.createElement("li");
        if (heading.tagName === "H3") item.classList.add("post-toc__subitem");
        const link = document.createElement("a");
        link.href = "#" + id;
        link.textContent = heading.textContent.trim();
        item.appendChild(link);
        list.appendChild(item);
    });

    toc.append(label, list);
    article.insertBefore(toc, article.firstChild);
}

function addCopyButtons(article) {
    const copyPage = byId("copy-page-link");
    if (copyPage && copyPage.dataset.initialized !== "true") {
        copyPage.dataset.initialized = "true";
        bindCopyButton(copyPage, () => window.location.href, { errorLabel: "Không sao chép được" });
    }

    article.querySelectorAll("pre").forEach((pre) => {
        if (pre.querySelector(".copy-code-btn")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "copy-code-btn";
        button.textContent = "Sao chép mã";
        bindCopyButton(button, () => pre.querySelector("code")?.textContent || pre.textContent, { errorLabel: "Lỗi sao chép" });
        pre.appendChild(button);
    });

    article.querySelectorAll(".tournament-code,[data-tournament-code]").forEach((element) => {
        if (element.dataset.copyButtonAdded === "true") return;
        element.dataset.copyButtonAdded = "true";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "copy-code-btn copy-code-btn--inline";
        button.textContent = "Sao chép mã";
        bindCopyButton(button, () => element.dataset.tournamentCode || element.textContent.trim(), { errorLabel: "Lỗi sao chép" });
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

/* ============================ 6. Hiệu ứng thẻ ============================ */

// Thẻ có ánh sáng theo con trỏ (trang chủ + các trang con).
const POINTER_CARD_SELECTOR = [
    ".event-card", ".post-card", ".partner-item",
    ".list-item-people", ".category-card", ".social-card", ".social-card-group", ".social-link-item",
    ".contact-card", ".contact-method", ".contact-donation", ".video-card", ".card-list .card",
    ".about-card", ".tournament-card", ".event-winner-card"
].join(", ");
// Thẻ trang con tự hiện dần (class is-visible) khi cuộn tới.
const SUBPAGE_REVEAL_SELECTOR = ".list-item-people, .category-card, .social-card, .social-card-group, .social-link-item, .contact-card, .contact-method, .contact-donation, .video-card, .card-list .card, .about-card, .tournament-card, .event-winner-card";
const REVEAL_VISIBLE_THRESHOLD = 0.1;

/**
 * Một listener pointermove cho cả trang (thay vì mỗi thẻ một listener); mọi thẻ
 * lồng nhau chứa con trỏ đều được cập nhật, và vị trí được gộp thành một lần
 * đọc + một lần ghi layout mỗi khung hình.
 */
function initializePointerGlow() {
    let frameId = 0;
    let pending = null;

    function flush() {
        frameId = 0;
        const { cards, x, y } = pending;
        const bounds = cards.map((card) => card.getBoundingClientRect());
        cards.forEach((card, position) => {
            card.style.setProperty("--mouse-x", `${x - bounds[position].left}px`);
            card.style.setProperty("--mouse-y", `${y - bounds[position].top}px`);
        });
    }

    document.addEventListener("pointermove", (event) => {
        if (!(event.target instanceof Element)) return;

        const cards = [];
        for (let card = event.target.closest(POINTER_CARD_SELECTOR); card; card = card.parentElement?.closest(POINTER_CARD_SELECTOR)) {
            cards.push(card);
        }
        if (!cards.length) return;

        pending = { cards, x: event.clientX, y: event.clientY };
        if (!frameId) frameId = window.requestAnimationFrame(flush);
    }, { passive: true });
}

function initializeCardEffects() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!reduceMotion && finePointer) initializePointerGlow();

    const revealTargets = new Set([
        ...document.querySelectorAll(".reveal-on-scroll,[data-reveal]"),
        ...document.querySelectorAll(SUBPAGE_REVEAL_SELECTOR)
    ]);
    if (reduceMotion) revealTargets.forEach((element) => element.classList.add("is-visible"));
    else revealWhenVisible(Array.from(revealTargets), REVEAL_VISIBLE_THRESHOLD);
}

/* ============================ Khởi tạo ============================ */

onReady(() => {
    const navigation = initializeNavigation();
    initializeScrollEffects();
    initializeGlobalSearch(navigation);
    initializeReadingUtilities();
    initializeCardEffects();
});
})();