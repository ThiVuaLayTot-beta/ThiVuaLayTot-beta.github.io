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
 * Interactive Daily Chess Puzzle (Smothered Mate) Logic - CYBER THEME
 */
document.addEventListener("DOMContentLoaded", function() {
    const knight = document.getElementById("draggable-knight");
    const boardGrid = document.querySelector(".chess-board-grid");
    const hintBtn = document.getElementById("btn-hint");
    const solutionBtn = document.getElementById("btn-solution");
    const resetBtn = document.getElementById("btn-reset");
    const feedback = document.getElementById("puzzle-feedback");

    if (!knight || !boardGrid) return;

    // Squares in 1D array representing the 8x8 board:
    // Row 8 represents squares 0-7, Row 7 represents 8-15, etc.
    // The correct checkmate move is Knight to f7 (Index 14) which is the 15th square.
    // Index 6 (7th square) is another move (Nxe8) which is incorrect because it doesn't mate in 1.
    const squares = boardGrid.querySelectorAll(".board-square");

    knight.addEventListener("click", function(e) {
        e.stopPropagation();
        boardGrid.classList.toggle("highlight-knight");
    });

    // Close highlights when clicking anywhere else
    document.addEventListener("click", function() {
        boardGrid.classList.remove("highlight-knight");
    });

    // Handle board squares click for the correct mate
    squares.forEach((square, index) => {
        square.addEventListener("click", function() {
            if (!boardGrid.classList.contains("highlight-knight")) return;

            // Correct move: Index 14 (h7 in coordinate mapping r7-f7)
            if (index === 14) {
                makeMove(true);
            }
            // Incorrect move: Index 6 (g8/r7-f8 in coordinates mapping)
            else if (index === 6) {
                makeMove(false);
            }

            boardGrid.classList.remove("highlight-knight");
        });
    });

    function makeMove(isCorrect) {
        if (isCorrect) {
            knight.className = "piece-overlay white-knight knight-moved-correct";
            feedback.className = "puzzle-feedback feedback-correct";
            feedback.innerHTML = '<i class="bx bxs-check-circle"></i> [GIẢI MÃ THÀNH CÔNG] Mã nhảy f7 chiếu bí thắt nghẹt (Smothered Mate) hoàn hảo. Vua đen hoàn toàn bất động!';
            feedback.style.display = "flex";
            solutionBtn.style.display = "none";
            hintBtn.style.display = "none";
            resetBtn.style.display = "inline-flex";
        } else {
            knight.className = "piece-overlay white-knight knight-moved-incorrect";
            feedback.className = "puzzle-feedback feedback-incorrect";
            feedback.innerHTML = '<i class="bx bxs-x-circle"></i> [SYS_ERROR: SAI LẦM] Ăn Xe ở g8 tuy thu được vật chất nhưng không thể dứt điểm trận đấu ngay lập tức!';
            feedback.style.display = "flex";
            resetBtn.style.display = "inline-flex";
        }
    }

    hintBtn.addEventListener("click", function() {
        feedback.className = "puzzle-feedback feedback-hint";
        feedback.innerHTML = '<i class="bx bxs-help-circle"></i> [DATA_HINT]: Tìm tọa độ Mã chiếu trực tiếp Vua Đen h8 mà không bị Xe Đen tiêu diệt, tận dụng các quân tốt đen tự bao vây Vua của chúng!';
        feedback.style.display = "flex";
    });

    solutionBtn.addEventListener("click", function() {
        makeMove(true);
    });

    resetBtn.addEventListener("click", function() {
        knight.className = "piece-overlay r6-f6 white-knight knight-playable";
        feedback.style.display = "none";
        solutionBtn.style.display = "inline-flex";
        hintBtn.style.display = "inline-flex";
        resetBtn.style.display = "none";
        boardGrid.classList.remove("highlight-knight");
    });
});
