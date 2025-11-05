/* Performance Monitoring and Optimization */

(function () {
  'use strict';

  // Performance monitoring
  function initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
          
          // Log to analytics if available
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
              metric_name: 'LCP'
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP monitoring not supported:', e);
      }

      // Monitor First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fid = entry.processingStart - entry.startTime;
            console.log('FID:', fid);
            
            if (window.gtag) {
              window.gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                value: Math.round(fid),
                metric_name: 'FID'
              });
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID monitoring not supported:', e);
      }

      // Monitor Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          console.log('CLS:', clsValue);
          
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              value: Math.round(clsValue * 1000),
              metric_name: 'CLS'
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS monitoring not supported:', e);
      }
    }

    // Log page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
        const firstPaint = performance.getEntriesByType('paint').find(
          entry => entry.name === 'first-contentful-paint'
        );

        console.log('Performance Metrics:', {
          pageLoadTime: `${pageLoadTime}ms`,
          domContentLoaded: `${domContentLoaded}ms`,
          firstPaint: firstPaint ? `${Math.round(firstPaint.startTime)}ms` : 'N/A'
        });

        // Send to analytics if available
        if (window.gtag) {
          window.gtag('event', 'timing_complete', {
            name: 'load',
            value: pageLoadTime,
            event_category: 'Performance'
          });
        }
      }, 0);
    });
  }

  // Image optimization utilities
  function optimizeImage(img) {
    // Use responsive images with srcset if supported
    if (img.src && !img.srcset) {
      const src = img.src;
      // Generate srcset for responsive images (if URL supports it)
      if (src.includes('unsplash.com') || src.includes('?')) {
        const baseUrl = src.split('?')[0];
        const params = new URLSearchParams(src.split('?')[1] || '');
        const width = params.get('w') || '1600';
        
        // Generate srcset for different viewport sizes
        const srcset = [
          `${baseUrl}?${params.toString().replace(/w=\d+/, 'w=400')} 400w`,
          `${baseUrl}?${params.toString().replace(/w=\d+/, 'w=800')} 800w`,
          `${baseUrl}?${params.toString().replace(/w=\d+/, 'w=1200')} 1200w`,
          `${baseUrl}?${params.toString().replace(/w=\d+/, 'w=1600')} 1600w`
        ].join(', ');
        
        img.srcset = srcset;
        img.sizes = '(max-width: 400px) 400px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1600px';
      }
    }

    // Add fetchpriority for above-the-fold images
    if (img.getBoundingClientRect().top < window.innerHeight * 2) {
      img.setAttribute('fetchpriority', 'high');
    }

    // Use modern image formats (WebP) if supported
    if (img.src && !img.src.includes('.webp')) {
      // If the image source supports WebP, we could rewrite it here
      // This would require server-side support or a CDN that converts images
    }
  }

  // Enhanced lazy loading with IntersectionObserver
  function initEnhancedLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // Load the image
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            
            // Optimize the image
            optimizeImage(img);
            
            // Add fade-in animation
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease-in';
            
            img.onload = () => {
              img.style.opacity = '1';
            };
            
            // Stop observing once loaded
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      });

      // Observe all images with data-src attribute
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
      
      // Enhance existing lazy-loaded images without data-src
      document.querySelectorAll('img[loading="lazy"]:not([data-src])').forEach((img) => {
        // Optimize images that are already loaded
        if (img.complete) {
          optimizeImage(img);
        } else {
          img.addEventListener('load', () => optimizeImage(img));
        }
      });
    }
  }

  // Preload critical resources
  function preloadCriticalResources() {
    // Preload fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    fontLink.href = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
    document.head.appendChild(fontLink);

    // Preload critical CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'preload';
    cssLink.as = 'style';
    cssLink.href = '/assets/css/styles.css';
    document.head.appendChild(cssLink);
  }

  // Resource hints for better performance
  function addResourceHints() {
    // DNS prefetch for external domains
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://images.unsplash.com',
      'https://www.gstatic.com',
      'https://firestore.googleapis.com',
      'https://firebasestorage.googleapis.com'
    ];

    domains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initPerformanceMonitoring();
      initEnhancedLazyLoading();
      preloadCriticalResources();
      addResourceHints();
    });
  } else {
    initPerformanceMonitoring();
    initEnhancedLazyLoading();
    preloadCriticalResources();
    addResourceHints();
  }

  // Expose optimization function for use in other scripts
  window.optimizeImage = optimizeImage;
})();
