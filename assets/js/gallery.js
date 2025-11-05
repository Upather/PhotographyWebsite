/* global firebaseConfig */
(function () {
  const grid = document.getElementById("portfolio-grid");
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  
  // Cache portfolio items for better performance
  let cachedItems = [];
  let currentFilter = "all";
  let currentSearchQuery = "";
  let imageObserver = null;
  
  // Store full item data for search
  let itemDataCache = [];

  // Enhanced lazy loading with Intersection Observer
  function initImageObserver() {
    if ('IntersectionObserver' in window) {
      imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            
            if (dataSrc && !img.classList.contains('loaded')) {
              // Load the image
              img.src = dataSrc;
              img.classList.add('loaded');
              
              // Remove loading placeholder
              img.classList.remove('loading');
              
              // Handle load event
              img.addEventListener('load', () => {
                img.classList.add('fade-in');
              }, { once: true });
              
              // Handle error
              img.addEventListener('error', () => {
                img.classList.add('error');
                img.alt = 'Failed to load image';
              }, { once: true });
              
              // Stop observing once loaded
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      });
    }
  }

  function render(items) {
    if (!grid) return;
    grid.innerHTML = "";
    cachedItems = [];
    
    // Initialize Intersection Observer if not already done
    if (!imageObserver && 'IntersectionObserver' in window) {
      initImageObserver();
    }
    
    items.forEach((it) => {
      const figure = document.createElement("figure");
      figure.className = "portfolio-item";
      const category = String(it.category || "campaign");
      figure.setAttribute("data-category", category);

      const img = document.createElement("img");
      const imageUrl = String(it.url || "");
      
      // Use data-src for lazy loading with Intersection Observer
      // Fallback to native lazy loading if IntersectionObserver not supported
      if (imageObserver) {
        img.setAttribute("data-src", imageUrl);
        img.setAttribute("src", "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f5f5f7' width='400' height='400'/%3E%3C/svg%3E"); // Placeholder
        img.classList.add("loading");
      } else {
        // Fallback to native lazy loading
        img.setAttribute("src", imageUrl);
        img.setAttribute("loading", "lazy");
      }
      
      img.setAttribute("alt", String(it.metadata?.altText || it.metadata?.title || it.caption || "Portfolio image"));
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
      
      // Observe image for lazy loading
      if (imageObserver) {
        imageObserver.observe(img);
      }
      
      // Cache the item with its category and searchable data for fast filtering
      const itemData = {
        element: figure,
        category: category,
        title: String(it.metadata?.title || it.caption || ""),
        description: String(it.metadata?.description || ""),
        keywords: String(it.metadata?.keywords || "").toLowerCase(),
        altText: String(it.metadata?.altText || it.metadata?.title || it.caption || "")
      };
      
      cachedItems.push(itemData);
      itemDataCache.push({
        ...itemData,
        rawData: it // Store full data for reference
      });
    });
    
    // Apply current filter after rendering
    if (currentFilter) {
      applyFilter(currentFilter);
    }
  }

  function applyFilter(category) {
    currentFilter = category;
    applyFilters(); // Apply both category and search filters
  }
  
  function applySearch(query) {
    currentSearchQuery = query.toLowerCase().trim();
    applyFilters(); // Apply both category and search filters
  }
  
  function applyFilters() {
    // Use requestAnimationFrame to batch DOM updates for better performance
    requestAnimationFrame(() => {
      let visibleCount = 0;
      
      // Apply both category filter and search query
      cachedItems.forEach((itemData) => {
        const { element, category: itemCategory, title, description, keywords, altText } = itemData;
        
        // Category match
        const categoryMatch = currentFilter === "all" || itemCategory === currentFilter;
        
        // Search match (if query exists)
        let searchMatch = true;
        if (currentSearchQuery) {
          const searchableText = `${title} ${description} ${keywords} ${altText}`.toLowerCase();
          searchMatch = searchableText.includes(currentSearchQuery);
        }
        
        // Item is visible if both category and search match
        const isVisible = categoryMatch && searchMatch;
        
        if (isVisible) {
          element.classList.remove("filter-hidden");
          element.classList.add("filter-visible");
          visibleCount++;
        } else {
          element.classList.remove("filter-visible");
          element.classList.add("filter-hidden");
        }
      });
      
      // Update grid layout after filtering
      if (grid) {
        grid.style.minHeight = visibleCount > 0 ? "" : "200px";
      }
      
      // Update empty state message if needed
      updateEmptyState(visibleCount === 0);
    });
  }
  
  function updateEmptyState(isEmpty) {
    if (!grid) return;
    
    let emptyMessage = grid.querySelector('.gallery-empty-state');
    if (isEmpty && !emptyMessage) {
      emptyMessage = document.createElement('div');
      emptyMessage.className = 'gallery-empty-state';
      emptyMessage.textContent = currentSearchQuery 
        ? `No results found for "${currentSearchQuery}"`
        : 'No images found';
      grid.appendChild(emptyMessage);
    } else if (!isEmpty && emptyMessage) {
      emptyMessage.remove();
    }
  }

  // Expose filter function globally for script.js integration
  window.galleryFilter = applyFilter;

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
  
  // Search functionality
  const searchInput = document.getElementById("gallery-search");
  const searchClear = document.getElementById("search-clear");
  
  if (searchInput) {
    // Debounce search input for performance
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value;
      
      // Show/hide clear button
      if (searchClear) {
        searchClear.style.display = query ? "flex" : "none";
      }
      
      searchTimeout = setTimeout(() => {
        applySearch(query);
      }, 300); // 300ms debounce
    });
    
    // Clear search
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchClear.style.display = "none";
        applySearch("");
      });
    }
    
    // Clear search on Escape key
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        if (searchClear) searchClear.style.display = "none";
        applySearch("");
        searchInput.blur();
      }
    });
  }

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
