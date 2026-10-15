document.addEventListener("DOMContentLoaded", () => {
    const filterInput = document.getElementById("post-filter-input");
    if (!filterInput) return;

    const cards = document.querySelectorAll(".category-card");

    filterInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();

        cards.forEach(card => {
            const title = card.querySelector(".category-card__title")?.textContent.toLowerCase() || "";
            const desc = card.querySelector(".category-card__description")?.textContent.toLowerCase() || "";
            const tag = card.querySelector(".category-card__tag")?.textContent.toLowerCase() || "";

            if (title.includes(term) || desc.includes(term) || tag.includes(term)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });
    });
});
