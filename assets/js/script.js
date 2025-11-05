// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("primary-nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
}

// Smooth scroll for internal links
document.addEventListener("click", (e) => {
  const target = e.target;
  if (target instanceof Element && target.matches('a[href^="#"]')) {
    const id = target.getAttribute("href");
    if (id && id.length > 1) {
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
});

// Portfolio filters
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
const portfolioItems = Array.from(document.querySelectorAll(".portfolio-item"));
function applyFilter(category) {
  portfolioItems.forEach((item) => {
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

// Lightbox
window.initLightbox = function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox?.querySelector(".lightbox-image");
  const lightboxCap = lightbox?.querySelector(".lightbox-caption");
  const lightboxClose = lightbox?.querySelector(".lightbox-close");
  const itemsLocal = Array.from(document.querySelectorAll(".portfolio-item"));
  function openLightbox(src, caption) {
    if (!lightbox || !lightboxImg || !lightboxCap) return;
    lightboxImg.setAttribute("src", src);
    lightboxCap.textContent = caption || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  itemsLocal.forEach((item) => {
    const img = item.querySelector("img");
    const caption = item.querySelector("figcaption")?.textContent || "";
    if (img)
      item.addEventListener("click", () => openLightbox(img.src, caption));
  });
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
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
