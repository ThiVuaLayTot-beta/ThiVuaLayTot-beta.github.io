/**
 * Lọc bài viết ngay trên trang danh mục sự kiện (_layouts/category.html):
 * ô #post-filter-input ẩn/hiện các thẻ .category-card theo tiêu đề, mô tả và nhãn,
 * không phân biệt hoa thường và dấu tiếng Việt.
 */
(() => {
    "use strict";

    const FILTER_DEBOUNCE_MS = 120;
    const SEARCHABLE_PARTS = [".category-card__title", ".category-card__description", ".category-card__tag"];

    const normalize = (value) => {
        if (typeof window.removeVietnameseTones === "function") {
            return window.removeVietnameseTones(value);
        }
        return String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, (character) => character === "đ" ? "d" : "D")
            .toLowerCase()
            .trim();
    };

    // Chỉ ghi DOM khi giá trị đổi: tránh thông báo lặp ở vùng aria-live và các thay đổi thừa.
    const setHidden = (element, hidden) => {
        if (element.hidden !== hidden) element.hidden = hidden;
    };
    const setText = (element, text) => {
        if (element && element.textContent !== text) element.textContent = text;
    };

    function getStatusMessage(query, visible, total) {
        if (!query) return `Hiển thị tất cả ${total} bài viết.`;
        return visible ? `Hiển thị ${visible}/${total} bài viết phù hợp.` : "Không tìm thấy bài viết phù hợp.";
    }

    /** Thông báo "không có kết quả", đặt ngay sau danh sách thẻ cuối cùng. */
    function ensureEmptyMessage(lastCard) {
        let empty = document.getElementById("category-empty-msg");
        if (empty) return empty;

        empty = document.createElement("p");
        empty.id = "category-empty-msg";
        empty.className = "category-empty-message";
        empty.setAttribute("role", "status");
        empty.hidden = true;
        empty.textContent = "Không tìm thấy bài viết nào phù hợp với từ khóa.";
        const container = lastCard.closest(".category-card-list, .category-posts-grid");
        (container || lastCard).insertAdjacentElement("afterend", empty);
        return empty;
    }

    function initialize() {
        const input = document.getElementById("post-filter-input");
        if (!input) return;

        const status = document.getElementById("category-filter-status");
        // Văn bản tìm kiếm của mỗi thẻ được chuẩn hoá một lần.
        const cards = Array.from(document.querySelectorAll(".category-card"), (element) => ({
            element,
            text: normalize(
                SEARCHABLE_PARTS.map((selector) => element.querySelector(selector)?.textContent).filter(Boolean).join(" ")
            )
        }));

        if (!cards.length) {
            setText(status, "Danh mục này hiện chưa có bài viết.");
            return;
        }

        const empty = ensureEmptyMessage(cards[cards.length - 1].element);

        function applyFilter() {
            const query = normalize(input.value);
            let visible = 0;
            cards.forEach(({ element, text }) => {
                const hidden = Boolean(query) && !text.includes(query);
                setHidden(element, hidden);
                if (!hidden) visible += 1;
            });
            setHidden(empty, visible > 0);
            setText(status, getStatusMessage(query, visible, cards.length));
        }

        let filterTimer = 0;
        input.addEventListener("input", () => {
            window.clearTimeout(filterTimer);
            filterTimer = window.setTimeout(applyFilter, FILTER_DEBOUNCE_MS);
        });
        applyFilter();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
