/* global firebaseConfig */
(function () {
  const grid = document.getElementById("portfolio-grid");
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

  function render(items) {
    if (!grid) return;
    grid.innerHTML = "";
    items.forEach((it) => {
      const figure = document.createElement("figure");
      figure.className = "portfolio-item";
      figure.setAttribute("data-category", String(it.category || "campaign"));

      const img = document.createElement("img");
      const imageUrl = String(it.url || "");
      
      // Enhanced lazy loading with data-src for better performance
      img.setAttribute("data-src", imageUrl);
      img.setAttribute("alt", String(it.metadata?.altText || it.metadata?.title || it.caption || "Portfolio image"));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      
      // Add placeholder or low-quality placeholder for better perceived performance
      if (it.metadata?.thumbnail) {
        img.setAttribute("src", String(it.metadata.thumbnail));
      } else {
        // Use a tiny transparent placeholder
        img.setAttribute("src", "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f5f5f7' width='400' height='300'/%3E%3C/svg%3E");
      }
      
      // Add title attribute for better SEO
      if (it.metadata?.title) {
        img.setAttribute("title", it.metadata.title);
      }
      
      // Optimize image loading with IntersectionObserver if available
      if (window.optimizeImage && typeof window.optimizeImage === 'function') {
        // Will be optimized when it comes into view
        img.addEventListener('load', function() {
          window.optimizeImage(this);
        });
      }
      
      // Load image when it comes into viewport (if IntersectionObserver is available)
      if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const targetImg = entry.target;
              const dataSrc = targetImg.getAttribute("data-src");
              if (dataSrc && targetImg.src !== dataSrc) {
                // Fade in animation
                targetImg.style.opacity = '0';
                targetImg.style.transition = 'opacity 0.3s ease-in';
                
                targetImg.onload = () => {
                  targetImg.style.opacity = '1';
                  targetImg.classList.add('loaded');
                };
                
                targetImg.src = dataSrc;
                targetImg.removeAttribute("data-src");
              }
              imgObserver.unobserve(targetImg);
            }
          });
        }, {
          rootMargin: '50px'
        });
        
        imgObserver.observe(img);
      } else {
        // Fallback: load immediately if IntersectionObserver not supported
        img.src = imageUrl;
        img.removeAttribute("data-src");
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
      const items = snap.docs.map((d) => d.data());
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
