/* global firebaseConfig */
(function () {
  const grid = document.getElementById("portfolio-grid");
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  const sectionButtons = Array.from(document.querySelectorAll(".portfolio-section-btn"));
  
  let currentSection = "all";
  let currentCategory = "all";

  function render(items) {
    if (!grid) return;
    grid.innerHTML = "";
    items.forEach((it) => {
      const figure = document.createElement("figure");
      figure.className = "portfolio-item";
      const category = String(it.category || "lifestyle");
      const section = String(it.portfolioSection || "fashion");
      figure.setAttribute("data-category", category);
      figure.setAttribute("data-section", section);

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
    applyFilters();
  }

  function applyFilters() {
    const items = Array.from(document.querySelectorAll(".portfolio-item"));
    items.forEach((item) => {
      const itemCategory = item.getAttribute("data-category");
      const itemSection = item.getAttribute("data-section");
      
      const sectionMatch = currentSection === "all" || itemSection === currentSection;
      const categoryMatch = currentCategory === "all" || itemCategory === currentCategory;
      
      item.style.display = (sectionMatch && categoryMatch) ? "" : "none";
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterButtons.forEach((b) =>
        b.setAttribute("aria-selected", String(b === btn))
      );
      currentCategory = btn.getAttribute("data-filter") || "all";
      applyFilters();
    });
  });

  sectionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sectionButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentSection = btn.getAttribute("data-section") || "all";
      applyFilters();
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
      const items = snap.docs.map((d) => d.data());
      if (items.length) {
        render(items);
        // Re-bind lightbox from script.js
        if (window.initLightbox) window.initLightbox();
        // Re-initialize social sharing if available
        if (window.socialSharing && window.socialSharing.initLightboxSharing) {
          window.socialSharing.initLightboxSharing();
        }
        return true;
      }
    } catch (err) {
      console.warn("Failed to load dynamic gallery:", err);
    }
    return false;
  }

  initDynamic();
})();
