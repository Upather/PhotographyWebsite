/* global firebaseConfig */
(function () {
  const grid = document.getElementById("portfolio-grid");
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

  function render(items) {
    if (!grid) return;
    grid.innerHTML = "";
    items.forEach((it, index) => {
      const figure = document.createElement("figure");
      figure.className = "portfolio-item";
      figure.setAttribute("data-category", String(it.category || "campaign"));
      
      // Add image ID for social sharing
      const imageId = it.id || `img-${it.category || "campaign"}-${index}`;
      figure.setAttribute("data-image-id", imageId);

      const img = document.createElement("img");
      img.setAttribute("src", String(it.url || ""));
      img.setAttribute("alt", String(it.metadata?.altText || it.metadata?.title || it.caption || "Portfolio image"));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      
      // Add title attribute for better SEO
      if (it.metadata?.title) {
        img.setAttribute("title", it.metadata.title);
      }

      const caption = document.createElement("figcaption");
      caption.textContent = String(it.metadata?.title || it.caption || "");

      figure.appendChild(img);
      figure.appendChild(caption);
      grid.appendChild(figure);
    });
  }

  function applyFilter(category) {
    const items = Array.from(document.querySelectorAll(".portfolio-item"));
    items.forEach((item) => {
      const match =
        category === "all" || item.getAttribute("data-category") === category;
      item.style.display = match ? "" : "none";
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterButtons.forEach((b) =>
        b.setAttribute("aria-selected", String(b === btn))
      );
      applyFilter(btn.getAttribute("data-filter"));
    });
  });

  async function initDynamic() {
    if (!window.firebaseConfig || typeof firebase === 'undefined') return false;
    try {
      let app;
      try {
        app = firebase.app("public");
      } catch (e) {
        app = firebase.initializeApp(window.firebaseConfig, "public");
      }
      const db = firebase.firestore(app);
      const snap = await db.collection("gallery").orderBy("order").get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (items.length) {
        render(items);
        // Re-bind lightbox from script.js
        if (window.initLightbox) window.initLightbox();
        return true;
      }
    } catch (err) {
      console.warn("Failed to load dynamic gallery:", err);
    }
    return false;
  }

  initDynamic();
})();
