function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

document.addEventListener("DOMContentLoaded", () => {
  const filterInput = document.getElementById("post-filter-input");
  const postsContainer = document.querySelector(".category-card-list, .category-posts-grid");
  if (!filterInput || !postsContainer) return;

  const cards = postsContainer.querySelectorAll(".category-card");

  let emptyMsg = document.getElementById("category-empty-msg");
  if (!emptyMsg) {
    emptyMsg = document.createElement("p");
    emptyMsg.id = "category-empty-msg";
    emptyMsg.style.display = "none";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "1.5rem";
    emptyMsg.textContent = "Không tìm thấy bài viết nào phù hợp với từ khóa.";
    postsContainer.parentNode.insertBefore(emptyMsg, postsContainer.nextSibling);
  }

  filterInput.addEventListener("input", (e) => {
    const query = removeVietnameseTones(e.target.value);
    let visibleCount = 0;
    cards.forEach((card) => {
      const title = removeVietnameseTones(card.querySelector(".categor-ycard_title, .category--card__title")?.textContent || "");
      const desc = removeVietnameseTones(card.querySelector(".category-card__description")?.textContent || "");
      if (!query || title.includes(query) || desc.includes(query)) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });
    emptyMsg.style.display = visibleCount === 0 ? "block" : "none";
  });
});
