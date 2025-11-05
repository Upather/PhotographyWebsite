/* Social Sharing & Integration Module */

(function () {
  'use strict';

  // Social sharing configuration
  const socialConfig = {
    baseUrl: window.location.origin + window.location.pathname,
    instagram: {
      enabled: true,
      username: '' // To be configured
    },
    facebook: {
      appId: '' // Optional: for Facebook SDK
    }
  };

  /**
   * Create shareable URL for an image
   */
  function createImageUrl(imageSrc, imageTitle = '') {
    const url = new URL(imageSrc, window.location.origin);
    const shareUrl = new URL(socialConfig.baseUrl);
    if (imageTitle) {
      shareUrl.searchParams.set('image', encodeURIComponent(imageSrc));
      shareUrl.searchParams.set('title', encodeURIComponent(imageTitle));
    }
    return shareUrl.toString();
  }

  /**
   * Share to Facebook
   */
  function shareToFacebook(imageUrl, imageTitle, description) {
    const url = new URL('https://www.facebook.com/sharer/sharer.php');
    url.searchParams.set('u', imageUrl);
    url.searchParams.set('quote', description || imageTitle);
    window.open(url.toString(), 'facebook-share', 'width=600,height=400');
  }

  /**
   * Share to Twitter/X
   */
  function shareToTwitter(imageUrl, imageTitle, description) {
    const url = new URL('https://twitter.com/intent/tweet');
    url.searchParams.set('url', imageUrl);
    url.searchParams.set('text', description || imageTitle);
    window.open(url.toString(), 'twitter-share', 'width=600,height=400');
  }

  /**
   * Share to Pinterest
   */
  function shareToPinterest(imageUrl, imageSrc, imageTitle, description) {
    const url = new URL('https://pinterest.com/pin/create/button/');
    url.searchParams.set('url', imageUrl);
    url.searchParams.set('media', imageSrc);
    url.searchParams.set('description', description || imageTitle);
    window.open(url.toString(), 'pinterest-share', 'width=600,height=400');
  }

  /**
   * Share to Instagram (opens Instagram app or website)
   * Note: Instagram doesn't support direct sharing via URL, so we provide instructions
   */
  function shareToInstagram(imageSrc, imageTitle) {
    // Copy image URL to clipboard for manual sharing
    copyToClipboard(imageSrc);
    
    // Show instructions
    const message = `Image URL copied! Open Instagram and paste the URL.\n\nImage: ${imageSrc}`;
    alert(message);
    
    // Alternative: open Instagram in new tab
    window.open('https://www.instagram.com/', '_blank');
  }

  /**
   * Copy image link to clipboard
   */
  function copyToClipboard(text, showNotification = true) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (showNotification) {
          showNotificationMessage('Link copied to clipboard!');
        }
      }).catch(err => {
        console.error('Failed to copy:', err);
        fallbackCopyToClipboard(text, showNotification);
      });
    } else {
      fallbackCopyToClipboard(text, showNotification);
    }
  }

  /**
   * Fallback copy method for older browsers
   */
  function fallbackCopyToClipboard(text, showNotification) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (showNotification) {
        showNotificationMessage('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showNotificationMessage('Failed to copy link. Please copy manually.');
    }
    document.body.removeChild(textArea);
  }

  /**
   * Show notification message
   */
  function showNotificationMessage(message) {
    // Remove existing notification if any
    const existing = document.querySelector('.share-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Update Open Graph and Twitter Card meta tags for sharing
   */
  function updateMetaTags(imageUrl, imageTitle, description) {
    // Update or create Open Graph tags
    setMetaTag('og:image', imageUrl);
    setMetaTag('og:image:url', imageUrl);
    setMetaTag('og:image:type', 'image/jpeg');
    setMetaTag('og:title', imageTitle);
    setMetaTag('og:description', description || imageTitle);
    setMetaTag('og:url', window.location.href);

    // Update or create Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:image', imageUrl);
    setMetaTag('twitter:title', imageTitle);
    setMetaTag('twitter:description', description || imageTitle);
  }

  /**
   * Set or update a meta tag
   */
  function setMetaTag(property, content) {
    const selector = property.startsWith('twitter:') 
      ? `meta[name="${property}"]` 
      : `meta[property="${property}"]`;
    
    let meta = document.querySelector(selector);
    if (!meta) {
      meta = document.createElement('meta');
      if (property.startsWith('twitter:')) {
        meta.setAttribute('name', property);
      } else {
        meta.setAttribute('property', property);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  /**
   * Create social sharing buttons HTML
   */
  function createSocialButtons(imageSrc, imageTitle, description) {
    const shareUrl = createImageUrl(imageSrc, imageTitle);
    const imageUrl = imageSrc.startsWith('http') ? imageSrc : new URL(imageSrc, window.location.origin).toString();

    return `
      <div class="social-share-container">
        <div class="social-share-buttons">
          <button class="social-share-btn facebook" aria-label="Share on Facebook" title="Share on Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>
          <button class="social-share-btn twitter" aria-label="Share on Twitter" title="Share on Twitter">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            <span>Twitter</span>
          </button>
          <button class="social-share-btn pinterest" aria-label="Share on Pinterest" title="Share on Pinterest">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
            <span>Pinterest</span>
          </button>
          <button class="social-share-btn instagram" aria-label="Share on Instagram" title="Share on Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <span>Instagram</span>
          </button>
          <button class="social-share-btn copy-link" aria-label="Copy image link" title="Copy image link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>Copy Link</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Initialize social sharing for lightbox
   */
  function initLightboxSharing() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    // Check if sharing container already exists
    let shareContainer = lightbox.querySelector('.social-share-container');
    if (!shareContainer) {
      const lightboxCaption = lightbox.querySelector('.lightbox-caption');
      if (lightboxCaption) {
        const container = document.createElement('div');
        container.innerHTML = createSocialButtons('', '', '');
        shareContainer = container.firstElementChild;
        lightboxCaption.parentNode.insertBefore(shareContainer, lightboxCaption.nextSibling);
      }
    }

    // Update sharing buttons when lightbox opens
    const observer = new MutationObserver(() => {
      if (lightbox.classList.contains('open')) {
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const lightboxCap = lightbox.querySelector('.lightbox-caption');
        if (lightboxImg && shareContainer) {
          const imageSrc = lightboxImg.getAttribute('src');
          const imageTitle = lightboxCap?.textContent || 'Portfolio Image';
          const imageAlt = lightboxImg.getAttribute('alt') || imageTitle;

          // Update meta tags for sharing
          updateMetaTags(imageSrc, imageTitle, imageAlt);

          // Update share buttons
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = createSocialButtons(imageSrc, imageTitle, imageAlt);
          shareContainer.innerHTML = tempDiv.querySelector('.social-share-buttons')?.outerHTML || '';

          // Attach event listeners
          attachShareListeners(shareContainer, imageSrc, imageTitle, imageAlt);
        }
      }
    });

    observer.observe(lightbox, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /**
   * Attach event listeners to share buttons
   */
  function attachShareListeners(container, imageSrc, imageTitle, description) {
    const shareUrl = createImageUrl(imageSrc, imageTitle);
    const imageUrl = imageSrc.startsWith('http') ? imageSrc : new URL(imageSrc, window.location.origin).toString();

    const facebookBtn = container.querySelector('.facebook');
    const twitterBtn = container.querySelector('.twitter');
    const pinterestBtn = container.querySelector('.pinterest');
    const instagramBtn = container.querySelector('.instagram');
    const copyBtn = container.querySelector('.copy-link');

    if (facebookBtn) {
      facebookBtn.onclick = () => shareToFacebook(shareUrl, imageTitle, description);
    }

    if (twitterBtn) {
      twitterBtn.onclick = () => shareToTwitter(shareUrl, imageTitle, description);
    }

    if (pinterestBtn) {
      pinterestBtn.onclick = () => shareToPinterest(shareUrl, imageUrl, imageTitle, description);
    }

    if (instagramBtn) {
      instagramBtn.onclick = () => shareToInstagram(imageUrl, imageTitle);
    }

    if (copyBtn) {
      copyBtn.onclick = () => copyToClipboard(shareUrl);
    }
  }

  /**
   * Initialize Instagram feed embedding
   */
  function initInstagramFeed() {
    const feedContainer = document.getElementById('instagram-feed');
    if (!feedContainer || !socialConfig.instagram.username) return;

    // This is a placeholder for Instagram feed integration
    // In production, you would use Instagram Basic Display API or a service like EmbedSocial
    fetch(`https://www.instagram.com/${socialConfig.instagram.username}/?__a=1&__d=dis`)
      .then(response => {
        if (!response.ok) throw new Error('Instagram feed unavailable');
        // Note: Instagram's public API is limited. Consider using:
        // - Instagram Basic Display API
        // - Third-party services like EmbedSocial, SnapWidget, etc.
        return response.json();
      })
      .then(data => {
        // Process Instagram data
        console.log('Instagram feed loaded', data);
      })
      .catch(err => {
        console.warn('Instagram feed integration requires API setup:', err);
        // Show fallback message
        feedContainer.innerHTML = `
          <div class="instagram-feed-placeholder">
            <p>Instagram feed integration requires API configuration.</p>
            <p>Configure your Instagram username in <code>assets/js/social-sharing.js</code></p>
          </div>
        `;
      });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLightboxSharing();
      initInstagramFeed();
    });
  } else {
    initLightboxSharing();
    initInstagramFeed();
  }

  // Export functions for global access
  window.socialSharing = {
    shareToFacebook,
    shareToTwitter,
    shareToPinterest,
    shareToInstagram,
    copyToClipboard,
    updateMetaTags,
    initLightboxSharing,
    initInstagramFeed,
    config: socialConfig
  };
})();

