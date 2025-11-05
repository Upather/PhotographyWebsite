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

  // Helper function to convert GPS coordinates from DMS to decimal degrees
  function convertDMSToDD(degrees, minutes, seconds, ref) {
    if (!degrees && degrees !== 0) return null;
    
    let dd = degrees;
    if (minutes) dd += minutes / 60;
    if (seconds) dd += seconds / 3600;
    
    // Apply reference (N/S for latitude, E/W for longitude)
    if (ref === 'S' || ref === 'W') {
      dd = -dd;
    }
    
    return dd;
  }

  // Helper function to extract and convert GPS coordinates
  function extractGPS(exifObj) {
    try {
      const lat = EXIF.getTag(exifObj, "GPSLatitude");
      const latRef = EXIF.getTag(exifObj, "GPSLatitudeRef");
      const lon = EXIF.getTag(exifObj, "GPSLongitude");
      const lonRef = EXIF.getTag(exifObj, "GPSLongitudeRef");
      
      if (!lat || !lon) return { latitude: null, longitude: null };
      
      // EXIF GPS data comes as arrays: [degrees, minutes, seconds]
      const latDecimal = convertDMSToDD(
        lat[0] || 0,
        lat[1] || 0,
        lat[2] || 0,
        latRef
      );
      
      const lonDecimal = convertDMSToDD(
        lon[0] || 0,
        lon[1] || 0,
        lon[2] || 0,
        lonRef
      );
      
      return {
        latitude: latDecimal,
        longitude: lonDecimal,
        // Keep original format for reference
        raw: {
          latitude: lat,
          latitudeRef: latRef,
          longitude: lon,
          longitudeRef: lonRef,
        }
      };
    } catch (err) {
      return { latitude: null, longitude: null };
    }
  }

  // Metadata cache with TTL (Time To Live)
  const metadataCache = {
    cache: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes
    
    get(key) {
      const item = this.cache.get(key);
      if (!item) return null;
      
      // Check if expired
      if (Date.now() > item.expires) {
        this.cache.delete(key);
        return null;
      }
      
      return item.data;
    },
    
    set(key, data) {
      this.cache.set(key, {
        data: data,
        expires: Date.now() + this.ttl,
      });
    },
    
    clear() {
      this.cache.clear();
    },
    
    // Clean expired entries
    cleanup() {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expires) {
          this.cache.delete(key);
        }
      }
    },
  };

  // Cleanup cache every minute
  setInterval(() => {
    metadataCache.cleanup();
  }, 60 * 1000);

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
            
            // Extract ISO (handle both single value and array)
            const isoTag = EXIF.getTag(this, "ISOSpeedRatings");
            const iso = Array.isArray(isoTag) ? isoTag[0] : isoTag;
            
            // Extract FNumber and format aperture
            const fNumber = EXIF.getTag(this, "FNumber");
            let aperture = "";
            if (fNumber) {
              // Handle both numeric and fractional formats
              const fValue = typeof fNumber === 'number' ? fNumber : fNumber.numerator / fNumber.denominator;
              aperture = `f/${fValue.toFixed(1)}`;
            }
            
            // Extract focal length
            const focalLengthTag = EXIF.getTag(this, "FocalLength");
            let focalLength = "";
            if (focalLengthTag) {
              const focalValue = typeof focalLengthTag === 'number' 
                ? focalLengthTag 
                : focalLengthTag.numerator / focalLengthTag.denominator;
              focalLength = `${Math.round(focalValue)}mm`;
            }
            
            // Extract date/time (prefer DateTimeOriginal, fallback to DateTime)
            const dateTime = EXIF.getTag(this, "DateTimeOriginal") || 
                            EXIF.getTag(this, "DateTime") || 
                            EXIF.getTag(this, "DateTimeDigitized") || 
                            "";
            
            // Extract orientation
            const orientation = EXIF.getTag(this, "Orientation") || null;
            
            // Extract flash mode
            const flash = EXIF.getTag(this, "Flash") || null;
            const flashMode = flash !== null ? (flash === 0 ? "No Flash" : "Flash") : null;
            
            // Extract white balance
            const whiteBalance = EXIF.getTag(this, "WhiteBalance") || null;
            const whiteBalanceMode = whiteBalance !== null 
              ? (whiteBalance === 0 ? "Auto" : "Manual") 
              : null;
            
            // Extract metering mode
            const meteringMode = EXIF.getTag(this, "MeteringMode") || null;
            
            // Extract exposure mode
            const exposureMode = EXIF.getTag(this, "ExposureMode") || null;
            const exposureModeText = exposureMode !== null 
              ? (exposureMode === 0 ? "Auto" : exposureMode === 1 ? "Manual" : "Auto Bracket")
              : null;
            
            // Extract image dimensions
            const width = EXIF.getTag(this, "PixelXDimension") || EXIF.getTag(this, "ImageWidth") || null;
            const height = EXIF.getTag(this, "PixelYDimension") || EXIF.getTag(this, "ImageHeight") || null;
            
            // Extract lens information
            const lensMake = EXIF.getTag(this, "LensMake") || "";
            const lensModel = EXIF.getTag(this, "LensModel") || "";
            
            // Extract GPS coordinates (properly converted)
            const gps = extractGPS(this);
            
            const exifData = {
              make: EXIF.getTag(this, "Make") || "",
              model: EXIF.getTag(this, "Model") || "",
              dateTime: dateTime,
              iso: iso || "",
              aperture: aperture,
              shutterSpeed: shutterSpeed,
              focalLength: focalLength,
              orientation: orientation,
              flash: flashMode,
              whiteBalance: whiteBalanceMode,
              meteringMode: meteringMode,
              exposureMode: exposureModeText,
              dimensions: {
                width: width,
                height: height,
              },
              lens: {
                make: lensMake,
                model: lensModel,
              },
              gps: gps,
            };
            
            resolve(exifData);
          } catch (err) {
            console.warn("EXIF extraction error:", err);
            resolve({});
          }
        });
      });
    },

    // Get image metadata from Firestore (with caching)
    async getImageMetadata(imageId) {
      // Check cache first
      const cacheKey = `metadata_${imageId}`;
      const cached = metadataCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      try {
        if (!db) {
          const app = firebase.app() || firebase.initializeApp(window.firebaseConfig, "metadata");
          db = firebase.firestore(app);
        }
        const docRef = db.collection("gallery").doc(imageId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
          return null;
        }
        
        const data = doc.data();
        const metadata = data?.metadata || {};
        
        // Cache the result
        metadataCache.set(cacheKey, metadata);
        
        return metadata;
      } catch (error) {
        console.error("Error getting metadata:", error);
        return null;
      }
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
        
        // Update cache
        const cacheKey = `metadata_${imageId}`;
        metadataCache.set(cacheKey, metadata);
        
        return true;
      } catch (error) {
        console.error("Error updating metadata:", error);
        return false;
      }
    },

    // Clear metadata cache (useful when data changes externally)
    clearCache() {
      metadataCache.clear();
    },

    // Generate structured data (JSON-LD) for SEO
    generateStructuredData(image) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        contentUrl: image.url,
        description: image.metadata?.description || image.caption || "",
        name: image.metadata?.title || image.caption || "",
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
      if (image.metadata?.keywords && Array.isArray(image.metadata.keywords) && image.metadata.keywords.length > 0) {
        structuredData.keywords = image.metadata.keywords.join(", ");
      }

      // Format and add dates
      if (image.metadata?.exif?.dateTime) {
        const dateStr = image.metadata.exif.dateTime;
        // Try to parse EXIF date format (YYYY:MM:DD HH:mm:ss)
        const exifDateMatch = dateStr.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (exifDateMatch) {
          const [, year, month, day, hour, minute, second] = exifDateMatch;
          const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
          structuredData.dateCreated = isoDate;
          structuredData.datePublished = isoDate;
        } else {
          structuredData.dateCreated = dateStr;
          structuredData.datePublished = dateStr;
        }
      }

      // Add dimensions if available
      if (image.metadata?.exif?.dimensions?.width && image.metadata?.exif?.dimensions?.height) {
        structuredData.width = image.metadata.exif.dimensions.width;
        structuredData.height = image.metadata.exif.dimensions.height;
      }

      // Add encoding format
      if (image.url) {
        const urlLower = image.url.toLowerCase();
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
          structuredData.encodingFormat = "image/jpeg";
        } else if (urlLower.includes('.png')) {
          structuredData.encodingFormat = "image/png";
        } else if (urlLower.includes('.webp')) {
          structuredData.encodingFormat = "image/webp";
        }
      }

      // Add GPS location if available
      if (image.metadata?.exif?.gps?.latitude !== null && 
          image.metadata?.exif?.gps?.longitude !== null &&
          typeof image.metadata.exif.gps.latitude === 'number' &&
          typeof image.metadata.exif.gps.longitude === 'number') {
        const lat = image.metadata.exif.gps.latitude;
        const lon = image.metadata.exif.gps.longitude;
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          structuredData.contentLocation = {
            "@type": "Place",
            geo: {
              "@type": "GeoCoordinates",
              latitude: lat,
              longitude: lon,
            },
          };
        }
      }

      return structuredData;
    },

    // Extract keywords automatically from image metadata and EXIF
    extractKeywords(image) {
      const keywords = new Set();
      
      // Add keywords from existing metadata
      if (image.metadata?.keywords && Array.isArray(image.metadata.keywords)) {
        image.metadata.keywords.forEach(kw => {
          if (kw && kw.trim()) keywords.add(kw.trim().toLowerCase());
        });
      }

      // Extract keywords from category
      if (image.category) {
        const categoryKeywords = {
          'safw': ['SA Fashion Week', 'fashion week', 'fashion', 'South Africa'],
          'sfw': ['Soweto Fashion Week', 'fashion week', 'fashion', 'Soweto'],
          'editorial': ['editorial', 'fashion editorial', 'photography'],
          'campaign': ['campaign', 'fashion campaign', 'advertising'],
        };
        const cats = categoryKeywords[image.category] || [image.category];
        cats.forEach(kw => keywords.add(kw.toLowerCase()));
      }

      // Extract keywords from title/caption
      const titleText = (image.metadata?.title || image.caption || '').toLowerCase();
      if (titleText) {
        // Extract common fashion-related terms
        const fashionTerms = ['fashion', 'style', 'model', 'runway', 'designer', 'couture', 'luxury', 
                            'photography', 'editorial', 'campaign', 'portrait', 'beauty', 'glamour'];
        fashionTerms.forEach(term => {
          if (titleText.includes(term)) {
            keywords.add(term);
          }
        });
      }

      // Extract keywords from EXIF data
      if (image.metadata?.exif) {
        const exif = image.metadata.exif;
        
        // Camera brand/model as keywords
        if (exif.make) {
          keywords.add(exif.make.toLowerCase());
        }
        if (exif.model) {
          const modelWords = exif.model.toLowerCase().split(/\s+/);
          modelWords.forEach(word => {
            if (word.length > 2) keywords.add(word);
          });
        }

        // Lens information
        if (exif.lens?.make) {
          keywords.add(exif.lens.make.toLowerCase());
        }
        if (exif.lens?.model) {
          const lensWords = exif.lens.model.toLowerCase().split(/\s+/);
          lensWords.forEach(word => {
            if (word.length > 2) keywords.add(word);
          });
        }

        // Technical settings as keywords
        if (exif.iso) {
          keywords.add(`iso${exif.iso}`);
        }
        if (exif.aperture) {
          keywords.add(exif.aperture.toLowerCase().replace('/', ''));
        }
        if (exif.focalLength) {
          const focal = exif.focalLength.toLowerCase().replace('mm', '').trim();
          keywords.add(`${focal}mm`);
        }
      }

      // Add location-based keywords if GPS available
      if (image.metadata?.exif?.gps?.latitude !== null && 
          image.metadata?.exif?.gps?.longitude !== null) {
        keywords.add('location tagged');
        keywords.add('geotagged');
      }

      // Add general photography keywords
      keywords.add('photography');
      keywords.add('professional photography');
      
      // Convert Set to Array and capitalize first letter of each keyword
      return Array.from(keywords).map(kw => {
        // Capitalize first letter
        return kw.charAt(0).toUpperCase() + kw.slice(1);
      }).filter(kw => kw.length > 0);
    },

    // Generate automatic alt text from image metadata
    generateAltText(image) {
      // If alt text already exists, use it
      if (image.metadata?.altText && image.metadata.altText.trim()) {
        return image.metadata.altText.trim();
      }

      const parts = [];

      // Start with title or caption
      if (image.metadata?.title && image.metadata.title.trim()) {
        parts.push(image.metadata.title.trim());
      } else if (image.caption && image.caption.trim()) {
        parts.push(image.caption.trim());
      }

      // Add description if available and different from title
      if (image.metadata?.description && image.metadata.description.trim()) {
        const desc = image.metadata.description.trim();
        if (!parts[0] || desc !== parts[0]) {
          // Use first sentence or first 100 characters of description
          const descPreview = desc.includes('.') 
            ? desc.split('.')[0] 
            : desc.substring(0, 100);
          if (descPreview && descPreview !== parts[0]) {
            parts.push(descPreview);
          }
        }
      }

      // Add category context
      if (image.category) {
        const categoryMap = {
          'safw': 'SA Fashion Week',
          'sfw': 'Soweto Fashion Week',
          'editorial': 'Editorial',
          'campaign': 'Campaign',
        };
        const categoryName = categoryMap[image.category] || image.category;
        if (!parts.some(p => p.toLowerCase().includes(categoryName.toLowerCase()))) {
          parts.push(categoryName);
        }
      }

      // Add EXIF context if available (camera, settings)
      if (image.metadata?.exif) {
        const exif = image.metadata.exif;
        const exifParts = [];
        
        if (exif.make || exif.model) {
          exifParts.push(`${exif.make || ""} ${exif.model || ""}`.trim());
        }
        
        if (exif.focalLength) {
          exifParts.push(exif.focalLength);
        }
        
        if (exif.aperture) {
          exifParts.push(exif.aperture);
        }
        
        if (exifParts.length > 0) {
          parts.push(`Photographed with ${exifParts.join(', ')}`);
        }
      }

      // Add location if GPS available
      if (image.metadata?.exif?.gps?.latitude !== null && 
          image.metadata?.exif?.gps?.longitude !== null) {
        parts.push('Location tagged photograph');
      }

      // If we have parts, join them intelligently
      if (parts.length > 0) {
        // Combine parts with appropriate punctuation
        let altText = parts[0];
        for (let i = 1; i < parts.length; i++) {
          // Add comma or period based on context
          if (parts[i].startsWith('Photographed') || parts[i].startsWith('Location')) {
            altText += '. ' + parts[i];
          } else {
            altText += ', ' + parts[i];
          }
        }
        // Ensure it ends with a period if it's a sentence
        if (altText.length > 50 && !altText.endsWith('.') && !altText.endsWith('!') && !altText.endsWith('?')) {
          altText += '.';
        }
        return altText;
      }

      // Fallback: use filename or generic description
      if (image.url) {
        const filename = image.url.split('/').pop() || '';
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        if (nameWithoutExt && nameWithoutExt.trim()) {
          return `Image: ${nameWithoutExt.trim()}`;
        }
      }

      return 'Professional fashion photography image';
    },

    // Generate Open Graph meta tags
    generateOpenGraphTags(image) {
      const altText = this.generateAltText(image);
      return {
        "og:image": image.url,
        "og:image:secure_url": image.url,
        "og:image:type": "image/jpeg",
        "og:image:alt": altText,
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

