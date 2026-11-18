(() => {
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

    function initialize() {
        const input = document.getElementById("post-filter-input");
        if (!input) return;

        document.querySelectorAll(".category-card__image[data-fallback-src]").forEach((image) => {
            image.addEventListener("error", () => {
                if (image.dataset.fallbackAttempted === "true") return;
                image.dataset.fallbackAttempted = "true";
                image.src = image.dataset.fallbackSrc;
            }, { once: true });
        });

        // Include curated cards appended through the category page content.
        const cards = Array.from(document.querySelectorAll(".category-card")).map((element) => ({
            element,
            text: normalize([
                element.querySelector(".category-card__title, .category-card_title")?.textContent,
                element.querySelector(".category-card__description")?.textContent,
                element.querySelector(".category-card__tag")?.textContent
            ].filter(Boolean).join(" "))
        }));

        if (!cards.length) return;

        let empty = document.getElementById("category-empty-msg");
        if (!empty) {
            empty = document.createElement("p");
            empty.id = "category-empty-msg";
            empty.className = "category-empty-message";
            empty.setAttribute("role", "status");
            empty.setAttribute("aria-live", "polite");
            empty.hidden = true;
            empty.textContent = "Không tìm thấy bài viết nào phù hợp với từ khóa.";
            const lastContainer = cards[cards.length - 1].element.closest(".category-card-list, .category-posts-grid");
            (lastContainer || cards[cards.length - 1].element).insertAdjacentElement("afterend", empty);
        }

        input.addEventListener("input", () => {
            const query = normalize(input.value);
            let visible = 0;
            cards.forEach(({ element, text }) => {
                element.hidden = Boolean(query) && !text.includes(query);
                if (!element.hidden) visible += 1;
            });
            empty.hidden = visible > 0;
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
