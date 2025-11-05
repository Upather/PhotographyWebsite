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

      // Helper function to format date for Schema.org
      function formatDateForSchema(dateValue) {
        if (!dateValue) return null;
        if (typeof dateValue === 'string') {
          // Try to parse EXIF date format (YYYY:MM:DD HH:mm:ss)
          const exifDateMatch = dateValue.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
          if (exifDateMatch) {
            const [, year, month, day, hour, minute, second] = exifDateMatch;
            return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
          }
          // If already ISO format, return as is
          if (dateValue.includes('T') || dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
            return dateValue;
          }
        }
        if (dateValue && typeof dateValue.toDate === 'function') {
          try {
            return dateValue.toDate().toISOString();
          } catch (e) {
            return null;
          }
        }
        return null;
      }

      // Create enhanced structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "ImageGallery",
        name: "Professional Fashion Photography Portfolio",
        description: "Professional fashion photography services for SA Fashion Week, Soweto Fashion Week, and exclusive bookings.",
        url: window.location.origin || "",
        publisher: {
          "@type": "Organization",
          name: "Professional Fashion Photography",
        },
        copyrightHolder: {
          "@type": "Person",
          name: "Professional Fashion Photographer",
        },
        image: images.map((img) => {
          const imageObj = {
            "@type": "ImageObject",
            contentUrl: img.url,
            description: img.metadata?.description || img.caption || "",
            name: img.metadata?.title || img.caption || "",
            creator: {
              "@type": "Person",
              name: "Professional Fashion Photographer",
            },
            copyrightHolder: {
              "@type": "Person",
              name: "Professional Fashion Photographer",
            },
          };

          // Add keywords if available
          if (img.metadata?.keywords && Array.isArray(img.metadata.keywords) && img.metadata.keywords.length > 0) {
            imageObj.keywords = img.metadata.keywords.join(", ");
          }

          // Add dateCreated and datePublished
          const exifDate = formatDateForSchema(img.metadata?.exif?.dateTime);
          const createdAtDate = formatDateForSchema(img.createdAt);
          const publishedDate = exifDate || createdAtDate;
          
          if (publishedDate) {
            imageObj.dateCreated = publishedDate;
            imageObj.datePublished = publishedDate;
          }

          // Add dimensions if available
          if (img.metadata?.exif?.dimensions?.width && img.metadata?.exif?.dimensions?.height) {
            imageObj.width = img.metadata.exif.dimensions.width;
            imageObj.height = img.metadata.exif.dimensions.height;
          }

          // Add encoding format
          if (img.url) {
            const urlLower = img.url.toLowerCase();
            if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
              imageObj.encodingFormat = "image/jpeg";
            } else if (urlLower.includes('.png')) {
              imageObj.encodingFormat = "image/png";
            } else if (urlLower.includes('.webp')) {
              imageObj.encodingFormat = "image/webp";
            }
          }

          // Add GPS location if available (using GeoCoordinates schema)
          if (img.metadata?.exif?.gps?.latitude !== null && 
              img.metadata?.exif?.gps?.longitude !== null &&
              typeof img.metadata.exif.gps.latitude === 'number' &&
              typeof img.metadata.exif.gps.longitude === 'number') {
            const lat = img.metadata.exif.gps.latitude;
            const lon = img.metadata.exif.gps.longitude;
            if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
              imageObj.contentLocation = {
                "@type": "Place",
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: lat,
                  longitude: lon,
                },
              };
            }
          }

          // Add EXIF metadata if available
          if (img.metadata?.exif) {
            const exif = img.metadata.exif;
            const exifInfo = [];
            if (exif.make || exif.model) {
              exifInfo.push(`${exif.make || ""} ${exif.model || ""}`.trim());
            }
            if (exif.iso) {
              exifInfo.push(`ISO ${exif.iso}`);
            }
            if (exif.aperture) {
              exifInfo.push(exif.aperture);
            }
            if (exif.shutterSpeed) {
              exifInfo.push(exif.shutterSpeed);
            }
            if (exif.focalLength) {
              exifInfo.push(exif.focalLength);
            }
            if (exifInfo.length > 0) {
              imageObj.about = exifInfo.join(", ");
            }
          }

          return imageObj;
        }),
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

