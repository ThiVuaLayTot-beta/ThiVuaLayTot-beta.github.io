/**
 * Main site navigation
 */
const menuBtn = document.getElementById("mobile-menu-btn");
const mobileNav = document.getElementById("mobile-nav-menu");
const dropdowns = document.querySelectorAll(".section.dropdown");
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

window.addEventListener("resize", () => {
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

/**
 * Scroll Progress Bar
 */
function updateScrollProgressBar() {
    const progressBar = document.getElementById("scroll-progress-bar");
    if (!progressBar) return;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
        progressBar.style.width = "0%";
        return;
    }
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const progress = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = progress + "%";
}

window.addEventListener("scroll", () => {
    updateScrollProgressBar();
}, { passive: true });


/**
 * Global Search Feature
 */
function initializeGlobalSearch() {
    const searchModalHtml = `
        <div id="global-search-modal" class="search-modal-overlay">
            <div class="search-modal-dialog">
                <div class="search-modal-header">
                    <span class="bx bx-search search-icon"></span>
                    <input type="text" id="global-search-input" placeholder="Tìm kiếm bài viết, giải đấu..." autocomplete="off">
                    <button id="close-search-modal" class="close-search-btn"><span class="bx bx-x"></span></button>
                </div>
                <div id="global-search-results" class="search-modal-results">
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', searchModalHtml);


    const openSearchBtn = document.getElementById('open-search-btn');
    const closeSearchBtn = document.getElementById('close-search-modal');
    const searchModal = document.getElementById('global-search-modal');
    const searchInput = document.getElementById('global-search-input');
    const searchResults = document.getElementById('global-search-results');

    if (!openSearchBtn || !searchModal) return;

    let searchData = [];
    let isDataLoaded = false;

    async function loadSearchData() {
        if (isDataLoaded) return;
        try {
            // We can create a simple search index from posts or use atom.xml if available.
            // For now, we'll try to fetch atom.xml
            const response = await fetch('/atom.xml');
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const entries = xml.querySelectorAll('entry');

            searchData = Array.from(entries).map(entry => ({
                title: entry.querySelector('title').textContent,
                link: entry.querySelector('link').getAttribute('href'),
                summary: entry.querySelector('summary')?.textContent || ''
            }));
            isDataLoaded = true;
            // Add static pages
            searchData.push({
                title: "Lịch sự kiện",
                link: "/schedule",
                summary: "Xem lịch các giải đấu và sự kiện sắp tới của CLB Thí Vua Lấy Tốt."
            });
            searchData.push({
                title: "Đội ngũ quản trị",
                link: "/leaders",
                summary: "Thông tin về ban quản trị và các điều hành viên của câu lạc bộ."
            });
            searchData.push({
                title: "Trang chủ",
                link: "/",
                summary: "Trang chủ CLB Thí Vua Lấy Tốt."
            });
            searchData.push({
                title: "Liên hệ",
                link: "/contact",
                summary: "Liên hệ và đóng góp cho CLB Thí Vua Lấy Tốt."
            });

        } catch (error) {
            console.error('Error loading search data:', error);
            searchResults.textContent = 'Không thể tải dữ liệu tìm kiếm.';
        }
    }

    function renderResults(query) {
        if (!query) {
            searchResults.textContent = '';
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results = searchData.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.summary.toLowerCase().includes(lowerQuery)
        );

        if (results.length === 0) {
            searchResults.textContent = 'Không tìm thấy kết quả nào.';
            return;
        }

        searchResults.textContent = '';
        results.forEach(item => {
            const resultItem = document.createElement('a');
            resultItem.className = 'search-result-item';
            resultItem.href = item.link;

            const title = document.createElement('h4');
            title.textContent = item.title;

            const summary = document.createElement('p');
            summary.textContent = item.summary.substring(0, 100) + '...';

            resultItem.appendChild(title);
            resultItem.appendChild(summary);

            searchResults.appendChild(resultItem);
        });
    }

    openSearchBtn.addEventListener('click', () => {
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        searchInput.focus();
        loadSearchData();
    });

    closeSearchBtn.addEventListener('click', () => {
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
        searchInput.value = '';
        searchResults.textContent = '';
    });

    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            closeSearchBtn.click();
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value.trim());
    });
}

window.addEventListener('load', initializeGlobalSearch);
