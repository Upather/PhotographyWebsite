// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("primary-nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
}

// Dropdown navigation toggle (mobile)
const dropdownTriggers = document.querySelectorAll(".nav-dropdown-trigger");
dropdownTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      const dropdown = trigger.closest(".nav-dropdown");
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isExpanded));
      dropdown?.setAttribute("aria-expanded", String(!isExpanded));
    }
  });
});

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  if (window.innerWidth > 768) return;
  const dropdowns = document.querySelectorAll(".nav-dropdown");
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(e.target)) {
      const trigger = dropdown.querySelector(".nav-dropdown-trigger");
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        dropdown.setAttribute("aria-expanded", "false");
      }
    }
  });
});

// Smooth scroll for internal links
document.addEventListener("click", (e) => {
  const target = e.target;
  if (target instanceof Element && target.matches('a[href^="#"]')) {
    const id = target.getAttribute("href");
    if (id && id.length > 1) {
      // Check if it's a link to another page
      const isExternal = target.closest('a[href*=".html"]') && !target.href.includes(window.location.pathname.split('/').pop());
      if (!isExternal) {
        const section = document.querySelector(id);
        if (section) {
          e.preventDefault();
          section.scrollIntoView({ behavior: "smooth", block: "start" });
          if (nav && nav.classList.contains("open")) {
            nav.classList.remove("open");
            navToggle?.setAttribute("aria-expanded", "false");
          }
        }
      }
    }
  }
});

// Page transition for navigation links
document.addEventListener("click", (e) => {
  const target = e.target.closest("a");
  if (target && target.href && target.href !== window.location.href) {
    const isInternalLink = target.hostname === window.location.hostname || !target.hostname;
    if (isInternalLink && !target.href.includes("#")) {
      document.body.style.opacity = "0";
      document.body.style.transition = "opacity 0.3s ease";
    }
  }
});

// Portfolio filters - handles multiple galleries per page
function initPortfolioFilters() {
  // Find all filter button groups (each gallery section has its own filters)
  const filterGroups = document.querySelectorAll(".filters");
  
  filterGroups.forEach((filterGroup) => {
    const filterButtons = Array.from(filterGroup.querySelectorAll(".filter-btn"));
    // Find the closest portfolio grid for this filter group
    const section = filterGroup.closest(".portfolio-section");
    if (!section) return;
    
    const portfolioGrid = section.querySelector(".portfolio-grid");
    if (!portfolioGrid) return;
    
    const portfolioItems = Array.from(portfolioGrid.querySelectorAll(".portfolio-item"));
    
    function applyFilter(category) {
      portfolioItems.forEach((item) => {
        const match =
          category === "all" || item.getAttribute("data-category") === category;
        item.style.display = match ? "" : "none";
        // Add animation class for smooth transition
        if (match) {
          item.style.animation = "fadeIn 0.3s ease";
        }
      });
    }
    
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Only update buttons in this filter group
        filterButtons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        applyFilter(btn.getAttribute("data-filter"));
      });
    });
  });
}

// Initialize filters when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPortfolioFilters);
} else {
  initPortfolioFilters();
}

// Lightbox
window.initLightbox = function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox?.querySelector(".lightbox-image");
  const lightboxCap = lightbox?.querySelector(".lightbox-caption");
  const lightboxClose = lightbox?.querySelector(".lightbox-close");
  const itemsLocal = Array.from(document.querySelectorAll(".portfolio-item"));
  let currentIndex = -1;
  let allImages = [];
  
  function openLightbox(src, caption, index = -1) {
    if (!lightbox || !lightboxImg || !lightboxCap) return;
    
    // Store current index if provided
    if (index >= 0) {
      currentIndex = index;
    }
    
    // Reset image state
    lightboxImg.classList.remove('loaded', 'fade-in');
    lightboxImg.classList.add('loading');
    lightboxImg.setAttribute("src", "");
    lightboxCap.textContent = "";
    lightboxCap.style.opacity = "0";
    
    // Show lightbox with fade-in
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    
    // Load image with fade-in effect
    requestAnimationFrame(() => {
      lightboxImg.setAttribute("src", src);
      
      // Handle image load
      lightboxImg.addEventListener('load', () => {
        lightboxImg.classList.remove('loading');
        lightboxImg.classList.add('loaded');
        requestAnimationFrame(() => {
          lightboxImg.classList.add('fade-in');
        });
        
        // Show caption with delay
        lightboxCap.textContent = caption || "";
        setTimeout(() => {
          lightboxCap.style.opacity = "1";
        }, 200);
      }, { once: true });
      
      // Handle image error
      lightboxImg.addEventListener('error', () => {
        lightboxImg.classList.remove('loading');
        lightboxImg.classList.add('error');
        lightboxCap.textContent = "Failed to load image";
        lightboxCap.style.opacity = "1";
      }, { once: true });
    });
  }
  
  function closeLightbox() {
    if (!lightbox) return;
    
    // Start fade-out animation
    lightbox.classList.add("closing");
    
    // Remove classes after animation completes
    setTimeout(() => {
      lightbox.classList.remove("open", "closing");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lightboxImg.classList.remove('loaded', 'fade-in', 'loading', 'error');
      lightboxCap.style.opacity = "0";
    }, 300); // Match CSS transition duration
  }
  
  // Initialize all images array for navigation
  function updateImagesArray() {
    allImages = itemsLocal
      .filter(item => !item.classList.contains('filter-hidden'))
      .map(item => {
        const img = item.querySelector("img");
        const caption = item.querySelector("figcaption")?.textContent || "";
        return img ? { src: img.src, caption: caption } : null;
      })
      .filter(Boolean);
  }
  
  itemsLocal.forEach((item, index) => {
    const img = item.querySelector("img");
    const caption = item.querySelector("figcaption")?.textContent || "";
    if (img) {
      item.addEventListener("click", () => {
        updateImagesArray();
        const itemIndex = allImages.findIndex(imgData => imgData.src === img.src);
        openLightbox(img.src, caption, itemIndex >= 0 ? itemIndex : -1);
      });
    }
  });
  
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  
  // Enhanced keyboard navigation
  function navigateLightbox(direction) {
    if (allImages.length === 0 || currentIndex < 0) return;
    
    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allImages.length;
    } else if (direction === 'prev') {
      newIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    }
    
    if (newIndex !== currentIndex) {
      const nextImage = allImages[newIndex];
      openLightbox(nextImage.src, nextImage.caption, newIndex);
    }
  }
  
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    
    // Prevent default browser behavior for arrow keys in lightbox
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    }
    
    if (e.key === "Escape") {
      closeLightbox();
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      navigateLightbox('next');
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      navigateLightbox('prev');
    }
  });
};
window.initLightbox();

// Reveal on scroll
const revealTargets = document.querySelectorAll(
  "[data-reveal], .portfolio-item, .service-card, .section-intro"
);
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.08 }
);
revealTargets.forEach((el) => io.observe(el));

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Social links (edit here once, applies to footer automatically)
const socialLinks = {
  Instagram: "#",
  Behance: "#",
  Email: "mailto:hello@example.com",
};
document
  .querySelectorAll(".site-footer .social a[aria-label]")
  .forEach((anchor) => {
    const label = anchor.getAttribute("aria-label");
    if (!label) return;
    const href = socialLinks[label];
    if (href) anchor.setAttribute("href", href);
    if (label !== "Email") {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }
  });
