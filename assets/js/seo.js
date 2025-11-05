/* global firebaseConfig, firebase */
(function () {
  if (!window.firebaseConfig || typeof firebase === 'undefined') return;

  let app, db;
  try {
    app = firebase.app() || firebase.initializeApp(window.firebaseConfig, "seo");
    db = firebase.firestore(app);
  } catch (e) {
    console.warn("Firebase not initialized for SEO:", e);
    return;
  }

  // Generate and inject structured data for all images
  async function generateStructuredData() {
    try {
      const snap = await db.collection("gallery").orderBy("order").get();
      const images = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Remove existing structured data script
      const existingScript = document.getElementById("structured-data-images");
      if (existingScript) existingScript.remove();

      // Create new structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "ImageGallery",
        name: "Professional Fashion Photography Portfolio",
        description: "Professional fashion photography services for SA Fashion Week, Soweto Fashion Week, and exclusive bookings.",
        image: images.map((img) => ({
          "@type": "ImageObject",
          contentUrl: img.url,
          description: img.metadata?.description || img.caption || "",
          name: img.metadata?.title || img.caption || "",
          keywords: img.metadata?.keywords || [],
          creator: {
            "@type": "Person",
            name: "Professional Fashion Photographer",
          },
          dateCreated: (() => {
            if (img.metadata?.exif?.dateTime) return img.metadata.exif.dateTime;
            if (img.createdAt?.toDate) {
              try {
                return img.createdAt.toDate().toISOString();
              } catch (e) {
                return "";
              }
            }
            return "";
          })(),
        })),
      };

      // Inject into page
      const script = document.createElement("script");
      script.id = "structured-data-images";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    } catch (error) {
      console.warn("Failed to generate structured data:", error);
    }
  }

  // Update Open Graph meta tags for individual images (when viewing in lightbox)
  function updateOpenGraphForImage(image) {
    const metaTags = {
      "og:image": image.url,
      "og:image:secure_url": image.url,
      "og:image:type": "image/jpeg",
      "og:image:alt": image.metadata?.altText || image.metadata?.description || image.caption || "",
      "og:title": image.metadata?.title || image.caption || "Professional Fashion Photography",
      "og:description": image.metadata?.description || image.caption || "",
    };

    Object.entries(metaTags).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    });
  }

  // Initialize on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", generateStructuredData);
  } else {
    generateStructuredData();
  }

  // Expose for use in lightbox
  window.seoManager = {
    updateOpenGraphForImage,
    generateStructuredData,
  };
})();

