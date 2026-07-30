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
 * Interactive Daily Chess Puzzle logic
 */
document.addEventListener("DOMContentLoaded", () => {
    const sqQueen = document.getElementById("sq-g5");
    const sqTarget = document.getElementById("sq-g7");
    const queenPiece = document.getElementById("queen-g5");
    const statusContainer = document.getElementById("puzzle-status");
    const btnReset = document.getElementById("btn-reset-puzzle");
    const allSquares = document.querySelectorAll(".board-square");

    let isQueenSelected = false;
    let isPuzzleSolved = localStorage.getItem("tvlt_puzzle_solved") === "true";

    // Initialize board state based on solved status
    function initPuzzle() {
        if (isPuzzleSolved) {
            showSuccessState();
        } else {
            resetBoardState();
        }
    }

    function showSuccessState() {
        // Move Queen to g7
        sqTarget.innerHTML = '<span class="chess-piece white-piece" id="queen-g5">♕</span>';
        sqQueen.innerHTML = '';

        // Remove hints
        allSquares.forEach(sq => {
            sq.classList.remove("selected-piece-square", "target-hint-square");
        });

        // Set solved message
        statusContainer.innerHTML = `
            <div class="status-box success">
                <i class="bx bxs-check-circle"></i>
                <span><strong>GIẢI MÃ THÀNH CÔNG!</strong> Bạn đã chiếu hết đối thủ bằng nước đi tuyệt vời <strong>Qxg7# (Hậu ăn Tốt g7 Chiếu Hết)</strong>!</span>
            </div>
        `;
    }

    function resetBoardState() {
        sqQueen.innerHTML = '<span class="chess-piece white-piece active-piece" id="queen-g5">♕</span>';
        sqTarget.innerHTML = '<span class="chess-piece black-piece" id="pawn-g7">♟</span>';
        isQueenSelected = false;

        allSquares.forEach(sq => {
            sq.classList.remove("selected-piece-square", "target-hint-square");
        });

        statusContainer.innerHTML = `
            <div class="status-box waiting">
                <i class="bx bx-cog bx-spin"></i>
                <span>Hệ thống đang chờ lệnh giải mã... Click vào quân Hậu trên bàn cờ để bắt đầu!</span>
            </div>
        `;

        // Re-attach listener if updated DOM elements
        const newQueen = document.getElementById("queen-g5");
        if (newQueen) {
            newQueen.addEventListener("click", handleQueenClick);
        }
    }

    function handleQueenClick(e) {
        if (isPuzzleSolved) return;
        e.stopPropagation();

        isQueenSelected = !isQueenSelected;

        if (isQueenSelected) {
            sqQueen.classList.add("selected-piece-square");
            sqTarget.classList.add("target-hint-square");
            statusContainer.innerHTML = `
                <div class="status-box waiting" style="border-color: #eab308;">
                    <i class="bx bx-target-lock" style="color: #eab308; font-size: 1.2rem;"></i>
                    <span>Hậu đã sẵn sàng di chuyển! Hãy click vào ô mục tiêu <strong>g7</strong> để thực hiện nước đi quyết định!</span>
                </div>
            `;
        } else {
            sqQueen.classList.remove("selected-piece-square");
            sqTarget.classList.remove("target-hint-square");
            statusContainer.innerHTML = `
                <div class="status-box waiting">
                    <i class="bx bx-cog bx-spin"></i>
                    <span>Hệ thống đang chờ lệnh... Click lại vào quân Hậu để chọn di chuyển!</span>
                </div>
            `;
        }
    }

    // Grid square clicks
    allSquares.forEach(sq => {
        sq.addEventListener("click", () => {
            if (isPuzzleSolved) return;

            const coord = sq.getAttribute("data-coord");

            if (isQueenSelected) {
                if (coord === "g7") {
                    // Correct move!
                    isPuzzleSolved = true;
                    localStorage.setItem("tvlt_puzzle_solved", "true");
                    showSuccessState();
                } else if (coord !== "g5") {
                    // Wrong move!
                    statusContainer.innerHTML = `
                        <div class="status-box error">
                            <i class="bx bxs-error-circle"></i>
                            <span>Nước đi không chính xác! Vua Đen hoặc các quân phòng thủ của Đen có thể hóa giải. Hãy suy nghĩ lại!</span>
                        </div>
                    `;
                    // Shake target box visual feedback
                    sq.classList.add("shake-visual");
                    setTimeout(() => sq.classList.remove("shake-visual"), 500);
                }
            }
        });
    });

    if (btnReset) {
        btnReset.addEventListener("click", () => {
            isPuzzleSolved = false;
            localStorage.removeItem("tvlt_puzzle_solved");
            resetBoardState();
        });
    }

    initPuzzle();
});
