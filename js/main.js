/**
 * Main JavaScript for Thí Vua Lấy Tốt
 * Handles navigation, scroll effects, and timeline animations.
 */

/**
 * Mobile Navigation Toggle and Dropdowns
 */
const menuBtn = document.getElementById("menu");
const dropdowns = document.querySelectorAll(".section.dropdown");

if (menuBtn) {
    menuBtn.addEventListener("click", function() {
        const nav = document.getElementById("tvltTopnav");
        const menuIcon = document.getElementById("menuIcon");

        nav.classList.toggle("active");
        const isActive = nav.classList.contains("active");

        this.setAttribute("aria-expanded", isActive);
        this.setAttribute("aria-label", isActive ? "Đóng menu điều hướng" : "Mở menu điều hướng");

        if (menuIcon) {
            if (menuIcon.classList.contains("bx-menu")) {
                menuIcon.classList.remove("bx-menu");
                menuIcon.classList.add("bx-x");
            } else {
                menuIcon.classList.remove("bx-x");
                menuIcon.classList.add("bx-menu");
            }
        }

        // Close all dropdowns when the mobile navigation bar is closed
        if (!isActive) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove("active");
                const trigger = dropdown.querySelector(".dropdown-trigger");
                if (trigger) {
                    trigger.setAttribute("aria-expanded", "false");
                }
            });
        }
    });
}

// Mobile Dropdown toggles click handler
dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    if (trigger) {
        trigger.addEventListener("click", function(e) {
            if (window.innerWidth <= 1024) {
                e.preventDefault();
                e.stopPropagation();

                const isActive = dropdown.classList.contains("active");

                // Collapse all other dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove("active");
                        const otherTrigger = other.querySelector(".dropdown-trigger");
                        if (otherTrigger) {
                            otherTrigger.setAttribute("aria-expanded", "false");
                        }
                    }
                });

                // Toggle current dropdown
                if (isActive) {
                    dropdown.classList.remove("active");
                    this.setAttribute("aria-expanded", "false");
                } else {
                    dropdown.classList.add("active");
                    this.setAttribute("aria-expanded", "true");
                }
            }
        });
    }
});

/**
 * Page Load Events
 */
window.addEventListener("load", function() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.classList.remove("show");
    }
});

/**
 * Scroll Events and Performance Optimization
 */
const backToTopBtn = document.getElementById("back-to-top");
const timeline = document.querySelector('.timeline');
const rootStyle = document.documentElement.style;

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
 * Handles all scroll-based UI updates
 */
function handleScrollEffects() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (backToTopBtn) {
        backToTopBtn.style.display = scrollTop > 100 ? "flex" : "none";
    }

    // Timeline Scroll Progress
    if (timeline) {
        const rect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
            const start = rect.top;
            const end = rect.bottom;
            const current = windowHeight * 0.7; // Target line progress to 70% of viewport

            let scrollPercent = ((current - start) / (end - start)) * 100;
            scrollPercent = Math.min(Math.max(scrollPercent, 0), 100);

            rootStyle.setProperty('--timeline-progress', scrollPercent + '%');
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
 * Live Countdown Timer for Featured Event
 */
function initCountdownTimer() {
    const mainCard = document.getElementById("featured-main-card");
    if (!mainCard) return;

    let countdownInterval;

    function updateCountdown() {
        const targetStr = mainCard.getAttribute("data-countdown-date");
        if (!targetStr) return;

        let targetDate = new Date(targetStr);
        // Fallback for non-standard dates
        if (isNaN(targetDate.getTime())) {
            const formatted = targetStr.trim().replace(" ", "T");
            targetDate = new Date(formatted);
        }

        if (isNaN(targetDate.getTime())) return;

        const now = new Date().getTime();
        const difference = targetDate.getTime() - now;

        const daysEl = document.getElementById("countdown-days");
        const hoursEl = document.getElementById("countdown-hours");
        const minsEl = document.getElementById("countdown-minutes");
        const secsEl = document.getElementById("countdown-seconds");
        const badgeEl = document.getElementById("main-event-badge");

        if (difference <= 0) {
            clearInterval(countdownInterval);
            if (daysEl) daysEl.textContent = "00";
            if (hoursEl) hoursEl.textContent = "00";
            if (minsEl) minsEl.textContent = "00";
            if (secsEl) secsEl.textContent = "00";
            if (badgeEl) badgeEl.textContent = "ĐANG DIỄN RA";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
        if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
        if (badgeEl) badgeEl.textContent = "SẮP DIỄN RA";
    }

    // Run immediately and then every second
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    // Expose a way to restart if date changes
    window.restartCountdownTimer = () => {
        clearInterval(countdownInterval);
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    };
}

/**
 * Fetch and dynamic load upcoming events from existing API
 */
async function loadFeaturedEvents() {
    const API_URL = 'https://script.google.com/macros/s/AKfycbzQSXlw8AFu70j5-HFos3U21G2QNo190N6aXXxidrflAOfmObC_CH-DF9QuNY4DJY_HCw/exec';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) return;
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return; // Fallback to index.html structure
        }

        const events = data.events || data.tournaments || [];
        if (!events.length) return;

        // Parse and filter for future events
        const nowMs = Date.now();
        const parsedEvents = events.map(ev => {
            let formatted = (ev.startTime || "").trim().replace(" ", "T");
            if (formatted && !formatted.includes("+") && !formatted.includes("Z")) {
                formatted += "+07:00";
            }
            const dateObj = new Date(formatted);
            return {
                ...ev,
                timeMs: isNaN(dateObj.getTime()) ? 0 : dateObj.getTime(),
                dateObj: dateObj
            };
        }).filter(ev => ev.timeMs > nowMs);

        if (!parsedEvents.length) return; // No future events, keep high-quality defaults

        // Sort upcoming events chronologically
        parsedEvents.sort((a, b) => a.timeMs - b.timeMs);

        // Helper to map event type to banner
        const getBannerForType = (type, customBanner) => {
            if (customBanner) return customBanner;
            const bannerMap = {
                tvlt: "/images/events/sieu-giai-thi-vua-lay-tot.png",
                cttq: "/images/events/giai-chien-truong-thi-quan.png",
                cbtt: "/images/events/su-kien-co-bi-thi-tot.png",
                dttv: "/images/events/dau-truong-thi-vua.png",
                "club-arena": "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/VN-SenJin/phpjs58p98gfqbbaDynSFJ.png",
                "multi-club-arena": "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/VN-SenJin/php4oaq7r23q7n79I3kRE6.png",
                "swiss": "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/VN-SenJin/phpt9ef43prdg6f80YfkLo.png",
                "vote": "https://images.chesscomfiles.com/uploads/v1/images_users/tiny_mce/M-DinhHoangViet/php8s3ooliju70kciI1yut.png",
                "daily": "https://images.chesscomfiles.com/uploads/v1/chess_term/f1e3ca50-b739-11ea-a14a-a1c9be904231.1fc2467a.630x354o.73dd2efd0681.png"
            };
            return bannerMap[type] || "/images/tvlt/tvlt_bg.jpg";
        };

        // Format Vietnamese date helper
        const formatVnDate = (dateObj) => {
            const pad = n => String(n).padStart(2, "0");
            const d = dateObj.getDate();
            const m = dateObj.getMonth() + 1;
            const y = dateObj.getFullYear();
            const h = dateObj.getHours();
            const min = dateObj.getMinutes();

            const daysVn = ['Chủ Nhật', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];
            const dayName = daysVn[dateObj.getDay()];
            const prefix = dayName === 'Chủ Nhật' ? '' : 'Thứ ';

            return `${pad(h)}:${pad(min)}, ${prefix}${dayName} - ngày ${pad(d)}/${pad(m)}/${y}`;
        };

        // 1. Populate Main Event Card
        const mainEv = parsedEvents[0];
        const mainCard = document.getElementById("featured-main-card");
        if (mainCard && mainEv) {
            // Update countdown date
            const isoStr = mainEv.dateObj.toISOString();
            mainCard.setAttribute("data-countdown-date", isoStr);

            // Update title
            const titleEl = document.getElementById("main-event-title");
            if (titleEl) titleEl.textContent = mainEv.eventName || "Giải đấu sắp diễn ra";

            // Update banner
            const bannerEl = document.getElementById("main-event-banner");
            if (bannerEl) bannerEl.src = getBannerForType(mainEv.eventType, mainEv.bannerLink);

            // Update time
            const timeEl = document.getElementById("main-event-time");
            if (timeEl) {
                let timeStr = formatVnDate(mainEv.dateObj);
                if (mainEv.isTentative === 'Dự kiến' || mainEv.isTentative === 'Tentative') {
                    timeStr = "Dự kiến: " + timeStr;
                }
                timeEl.textContent = timeStr;
            }

            // Update rules
            const rulesEl = document.getElementById("main-event-rules");
            if (rulesEl) {
                rulesEl.textContent = `Thể thức: ${mainEv.eventRules || "Đấu trường"}`;
            }

            // Update button/link to joinLink if exists, else keep schedule page
            const btnEl = document.getElementById("main-event-btn");
            if (btnEl) {
                btnEl.href = mainEv.joinLink || "/schedule";
            }

            // Restart countdown with new target date
            if (window.restartCountdownTimer) {
                window.restartCountdownTimer();
            }
        }

        // 2. Populate Sub Card 1
        const subEv1 = parsedEvents[1];
        const subCard1 = document.getElementById("sub-card-1");
        if (subCard1 && subEv1) {
            const titleEl = document.getElementById("sub-event-title-1");
            if (titleEl) titleEl.textContent = subEv1.eventName || "Sự kiện sắp diễn ra";

            const bannerEl = document.getElementById("sub-event-banner-1");
            if (bannerEl) bannerEl.src = getBannerForType(subEv1.eventType, subEv1.bannerLink);

            const timeEl = document.getElementById("sub-event-time-1");
            if (timeEl) {
                let timeStr = formatVnDate(subEv1.dateObj);
                if (subEv1.isTentative === 'Dự kiến' || subEv1.isTentative === 'Tentative') {
                    timeStr = "Dự kiến: " + timeStr;
                }
                timeEl.innerHTML = `<i class="bx bx-calendar"></i> ${timeStr}`;
            }

            const btnEl = document.getElementById("sub-event-btn-1");
            if (btnEl) btnEl.href = subEv1.joinLink || "/schedule";
        } else if (subCard1 && !subEv1) {
            subCard1.style.display = "none";
        }

        // 3. Populate Sub Card 2
        const subEv2 = parsedEvents[2];
        const subCard2 = document.getElementById("sub-card-2");
        if (subCard2 && subEv2) {
            const titleEl = document.getElementById("sub-event-title-2");
            if (titleEl) titleEl.textContent = subEv2.eventName || "Sự kiện sắp diễn ra";

            const bannerEl = document.getElementById("sub-event-banner-2");
            if (bannerEl) bannerEl.src = getBannerForType(subEv2.eventType, subEv2.bannerLink);

            const timeEl = document.getElementById("sub-event-time-2");
            if (timeEl) {
                let timeStr = formatVnDate(subEv2.dateObj);
                if (subEv2.isTentative === 'Dự kiến' || subEv2.isTentative === 'Tentative') {
                    timeStr = "Dự kiến: " + timeStr;
                }
                timeEl.innerHTML = `<i class="bx bx-calendar"></i> ${timeStr}`;
            }

            const btnEl = document.getElementById("sub-event-btn-2");
            if (btnEl) btnEl.href = subEv2.joinLink || "/schedule";
        } else if (subCard2 && !subEv2) {
            subCard2.style.display = "none";
        }

    } catch (e) {
        console.error("Lỗi khi tải sự kiện nổi bật:", e);
    }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    initCountdownTimer();
    loadFeaturedEvents();
});
