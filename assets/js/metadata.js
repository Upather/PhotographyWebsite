/* global firebaseConfig, EXIF, firebase */
(function () {
  if (!window.firebaseConfig || typeof firebase === 'undefined') return;

  let app, db, storage;
  try {
    app = firebase.app() || firebase.initializeApp(window.firebaseConfig, "metadata");
    db = firebase.firestore(app);
    storage = firebase.storage(app);
  } catch (e) {
    console.warn("Firebase not initialized for metadata:", e);
    return;
  }

  // Metadata management functions
  window.metadataManager = {
    // Extract EXIF data from image file
    async extractEXIF(file) {
      return new Promise((resolve) => {
        if (typeof EXIF === 'undefined') {
          resolve({});
          return;
        }
        
        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          resolve({});
        }, 5000);
        
        EXIF.getData(file, function () {
          clearTimeout(timeout);
          try {
            const exposureTime = EXIF.getTag(this, "ExposureTime");
            const shutterSpeed = exposureTime ? 
              (exposureTime >= 1 ? `${exposureTime}s` : `1/${Math.round(1 / exposureTime)}s`) : "";
            
            const exifData = {
              make: EXIF.getTag(this, "Make") || "",
              model: EXIF.getTag(this, "Model") || "",
              dateTime: EXIF.getTag(this, "DateTime") || EXIF.getTag(this, "DateTimeOriginal") || "",
              iso: EXIF.getTag(this, "ISOSpeedRatings") || "",
              aperture: EXIF.getTag(this, "FNumber") ? `f/${EXIF.getTag(this, "FNumber")}` : "",
              shutterSpeed: shutterSpeed,
              focalLength: EXIF.getTag(this, "FocalLength") ? `${Math.round(EXIF.getTag(this, "FocalLength"))}mm` : "",
              gps: {
                latitude: EXIF.getTag(this, "GPSLatitude") || null,
                longitude: EXIF.getTag(this, "GPSLongitude") || null,
              },
            };
            resolve(exifData);
          } catch (err) {
            resolve({});
          }
        });
      });
    },

    // Update image metadata in Firestore
    async updateImageMetadata(imageId, metadata) {
      try {
        if (!db) {
          const app = firebase.app() || firebase.initializeApp(window.firebaseConfig, "metadata");
          db = firebase.firestore(app);
        }
        const docRef = db.collection("gallery").doc(imageId);
        await docRef.update({
          metadata: metadata,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        return true;
      } catch (error) {
        console.error("Error updating metadata:", error);
        return false;
      }
    },

    // Generate structured data (JSON-LD) for SEO
    generateStructuredData(image) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        contentUrl: image.url,
        description: image.metadata?.description || image.caption || "",
        name: image.metadata?.title || image.caption || "",
        keywords: image.metadata?.keywords || [],
        creator: {
          "@type": "Person",
          name: "Professional Fashion Photographer",
        },
      };

      if (image.metadata?.exif?.dateTime) {
        structuredData.dateCreated = image.metadata.exif.dateTime;
      }

      return structuredData;
    },

    // Generate Open Graph meta tags
    generateOpenGraphTags(image) {
      return {
        "og:image": image.url,
        "og:image:secure_url": image.url,
        "og:image:type": "image/jpeg",
        "og:image:alt": image.metadata?.altText || image.metadata?.description || image.caption || "",
        "og:title": image.metadata?.title || image.caption || "",
        "og:description": image.metadata?.description || image.caption || "",
      };
    },
  };

  // Search and filter functionality
  window.metadataSearch = {
    searchQuery: "",
    filterCategory: "all",

    init() {
      const searchInput = document.getElementById("metadata-search");
      const filterSelect = document.getElementById("metadata-filter-category");

      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          this.searchQuery = e.target.value.toLowerCase();
          this.applyFilters();
        });
      }

      if (filterSelect) {
        filterSelect.addEventListener("change", (e) => {
          this.filterCategory = e.target.value;
          this.applyFilters();
        });
      }
    },

    applyFilters() {
      const items = document.querySelectorAll(".gallery-item");
      items.forEach((item) => {
        const itemId = item.getAttribute("data-id");
        if (!itemId) return;

        const title = item.getAttribute("data-title") || "";
        const description = item.getAttribute("data-description") || "";
        const keywords = item.getAttribute("data-keywords") || "";
        const category = item.getAttribute("data-category") || "";

        const matchesSearch =
          !this.searchQuery ||
          title.toLowerCase().includes(this.searchQuery) ||
          description.toLowerCase().includes(this.searchQuery) ||
          keywords.toLowerCase().includes(this.searchQuery);

        const matchesCategory =
          this.filterCategory === "all" || category === this.filterCategory;

        if (matchesSearch && matchesCategory) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    },
  };

  // Initialize search on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.metadataSearch.init();
    });
  } else {
    window.metadataSearch.init();
  }
})();

