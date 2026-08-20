/**
 * Main JavaScript for Thí Vua Lấy Tốt.
 * Navigation, scroll effects and accessible keyboard behavior.
 */

const menuBtn = document.getElementById("menu");
const nav = document.getElementById("tvltTopnav");
const menuIcon = document.getElementById("menuIcon");
const dropdowns = document.querySelectorAll(".section.dropdown");

function closeDropdowns() {
    dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("active");
        const trigger = dropdown.querySelector(".dropdown-trigger");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
}

function closeMobileNav() {
    if (!nav) return;
    nav.classList.remove("active");
    if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Mở menu điều hướng");
    }
    if (menuIcon) {
        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    }
    closeDropdowns();
}

if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
        const isActive = nav.classList.toggle("active");
        menuBtn.setAttribute("aria-expanded", String(isActive));
        menuBtn.setAttribute("aria-label", isActive ? "Đóng menu điều hướng" : "Mở menu điều hướng");
        if (menuIcon) {
            menuIcon.classList.toggle("bx-menu", !isActive);
            menuIcon.classList.toggle("bx-x", isActive);
        }
        if (!isActive) closeDropdowns();
    });
}

dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", (event) => {
        if (window.innerWidth > 1024) return;
        event.preventDefault();
        event.stopPropagation();

        const isActive = dropdown.classList.contains("active");
        closeDropdowns();
        if (!isActive) {
            dropdown.classList.add("active");
            trigger.setAttribute("aria-expanded", "true");
        }
    });
});

if (nav) {
    nav.addEventListener("click", (event) => {
        const link = event.target.closest("a:not(.dropdown-trigger)");
        if (link && window.innerWidth <= 1024) closeMobileNav();
    });
}

window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) closeMobileNav();
}, { passive: true });

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeMobileNav();
        if (menuBtn) menuBtn.focus();
    }
});

window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.remove("show");
});

const backToTopBtn = document.getElementById("back-to-top");
const timeline = document.querySelector(".timeline");
const rootStyle = document.documentElement.style;
let isScrolling = false;

function handleScrollEffects() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (backToTopBtn) {
        backToTopBtn.style.display = scrollTop > 100 ? "flex" : "none";
        backToTopBtn.setAttribute("aria-hidden", scrollTop > 100 ? "false" : "true");
    }

    if (timeline) {
        const rect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top < windowHeight && rect.bottom > 0) {
            const current = windowHeight * 0.7;
            let scrollPercent = ((current - rect.top) / (rect.bottom - rect.top)) * 100;
            scrollPercent = Math.min(Math.max(scrollPercent, 0), 100);
            rootStyle.setProperty("--timeline-progress", `${scrollPercent}%`);
        }
    }
}

window.addEventListener("scroll", () => {
    if (isScrolling) return;
    isScrolling = true;
    window.requestAnimationFrame(() => {
        handleScrollEffects();
        isScrolling = false;
    });
}, { passive: true });

if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

handleScrollEffects();
