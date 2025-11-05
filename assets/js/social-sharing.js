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
    trackShare('facebook', imageUrl, imageTitle);
    const url = new URL('https://www.facebook.com/sharer/sharer.php');
    url.searchParams.set('u', imageUrl);
    url.searchParams.set('quote', description || imageTitle);
    window.open(url.toString(), 'facebook-share', 'width=600,height=400');
  }

  /**
   * Share to Twitter/X
   */
  function shareToTwitter(imageUrl, imageTitle, description) {
    trackShare('twitter', imageUrl, imageTitle);
    const url = new URL('https://twitter.com/intent/tweet');
    url.searchParams.set('url', imageUrl);
    url.searchParams.set('text', description || imageTitle);
    window.open(url.toString(), 'twitter-share', 'width=600,height=400');
  }

  /**
   * Share to Pinterest
   */
  function shareToPinterest(imageUrl, imageSrc, imageTitle, description) {
    trackShare('pinterest', imageUrl, imageTitle);
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
    trackShare('instagram', imageSrc, imageTitle);
    // Copy image URL to clipboard for manual sharing
    copyToClipboard(imageSrc, false);
    
    // Show instructions
    const message = `Image URL copied! Open Instagram and paste the URL.\n\nImage: ${imageSrc}`;
    alert(message);
    
    // Alternative: open Instagram in new tab
    window.open('https://www.instagram.com/', '_blank');
  }

  /**
   * Share to LinkedIn
   */
  function shareToLinkedIn(imageUrl, imageTitle, description) {
    trackShare('linkedin', imageUrl, imageTitle);
    const url = new URL('https://www.linkedin.com/sharing/share-offsite/');
    url.searchParams.set('url', imageUrl);
    window.open(url.toString(), 'linkedin-share', 'width=600,height=400');
  }

  /**
   * Share to WhatsApp (web)
   */
  function shareToWhatsApp(imageUrl, imageTitle, description) {
    trackShare('whatsapp', imageUrl, imageTitle);
    const text = encodeURIComponent(`${imageTitle}\n${description || ''}\n${imageUrl}`);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, 'whatsapp-share', 'width=600,height=600');
  }

  /**
   * Copy image link to clipboard
   */
  function copyToClipboard(text, showNotification = true) {
    const isShareUrl = text.includes(window.location.origin);
    if (isShareUrl) {
      trackShare('copy_link', text, '');
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (showNotification) {
          showNotificationMessage('Link copied to clipboard!');
        }
        if (isShareUrl) {
          trackShareSuccess('copy_link', text);
        }
      }).catch(err => {
        console.error('Failed to copy:', err);
        if (isShareUrl) {
          trackShareError('copy_link', text, err.message);
        }
        fallbackCopyToClipboard(text, showNotification);
      });
    } else {
      fallbackCopyToClipboard(text, showNotification);
      if (isShareUrl) {
        trackShareSuccess('copy_link', text);
      }
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
          <button class="social-share-btn linkedin" aria-label="Share on LinkedIn" title="Share on LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn</span>
          </button>
          <button class="social-share-btn pinterest" aria-label="Share on Pinterest" title="Share on Pinterest">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
            <span>Pinterest</span>
          </button>
          <button class="social-share-btn whatsapp" aria-label="Share on WhatsApp" title="Share on WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>WhatsApp</span>
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
    const linkedinBtn = container.querySelector('.linkedin');
    const pinterestBtn = container.querySelector('.pinterest');
    const whatsappBtn = container.querySelector('.whatsapp');
    const instagramBtn = container.querySelector('.instagram');
    const copyBtn = container.querySelector('.copy-link');

    if (facebookBtn) {
      facebookBtn.onclick = () => shareToFacebook(shareUrl, imageTitle, description);
    }

    if (twitterBtn) {
      twitterBtn.onclick = () => shareToTwitter(shareUrl, imageTitle, description);
    }

    if (linkedinBtn) {
      linkedinBtn.onclick = () => shareToLinkedIn(shareUrl, imageTitle, description);
    }

    if (pinterestBtn) {
      pinterestBtn.onclick = () => shareToPinterest(shareUrl, imageUrl, imageTitle, description);
    }

    if (whatsappBtn) {
      whatsappBtn.onclick = () => shareToWhatsApp(shareUrl, imageTitle, description);
    }

    if (instagramBtn) {
      instagramBtn.onclick = () => shareToInstagram(imageUrl, imageTitle);
    }

    if (copyBtn) {
      copyBtn.onclick = () => copyToClipboard(shareUrl);
    }
  }

  /**
   * Track social share actions
   */
  function trackShare(platform, shareUrl, imageTitle) {
    try {
      const shareData = {
        platform,
        shareUrl,
        imageTitle,
        timestamp: new Date().toISOString(),
        status: 'attempt'
      };

      // Store in localStorage
      const shares = JSON.parse(localStorage.getItem('social_shares') || '[]');
      shares.push(shareData);
      
      // Keep only last 500 shares
      if (shares.length > 500) {
        shares.shift();
      }
      
      localStorage.setItem('social_shares', JSON.stringify(shares));

      // Update platform statistics
      const platformStats = JSON.parse(localStorage.getItem('platform_stats') || '{}');
      if (!platformStats[platform]) {
        platformStats[platform] = { attempts: 0, successes: 0, errors: 0 };
      }
      platformStats[platform].attempts++;
      localStorage.setItem('platform_stats', JSON.stringify(platformStats));
    } catch (error) {
      console.warn('Share tracking failed:', error);
    }
  }

  /**
   * Track successful share
   */
  function trackShareSuccess(platform, shareUrl) {
    try {
      const shares = JSON.parse(localStorage.getItem('social_shares') || '[]');
      // Update the last share with this platform and URL
      for (let i = shares.length - 1; i >= 0; i--) {
        if (shares[i].platform === platform && shares[i].shareUrl === shareUrl && shares[i].status === 'attempt') {
          shares[i].status = 'success';
          shares[i].completedAt = new Date().toISOString();
          break;
        }
      }
      localStorage.setItem('social_shares', JSON.stringify(shares));

      // Update platform statistics
      const platformStats = JSON.parse(localStorage.getItem('platform_stats') || '{}');
      if (platformStats[platform]) {
        platformStats[platform].successes++;
      }
      localStorage.setItem('platform_stats', JSON.stringify(platformStats));
    } catch (error) {
      console.warn('Share success tracking failed:', error);
    }
  }

  /**
   * Track share error
   */
  function trackShareError(platform, shareUrl, errorMessage) {
    try {
      const shares = JSON.parse(localStorage.getItem('social_shares') || '[]');
      // Update the last share with this platform and URL
      for (let i = shares.length - 1; i >= 0; i--) {
        if (shares[i].platform === platform && shares[i].shareUrl === shareUrl && shares[i].status === 'attempt') {
          shares[i].status = 'error';
          shares[i].error = errorMessage;
          shares[i].completedAt = new Date().toISOString();
          break;
        }
      }
      localStorage.setItem('social_shares', JSON.stringify(shares));

      // Update platform statistics
      const platformStats = JSON.parse(localStorage.getItem('platform_stats') || '{}');
      if (platformStats[platform]) {
        platformStats[platform].errors++;
      }
      localStorage.setItem('platform_stats', JSON.stringify(platformStats));
    } catch (error) {
      console.warn('Share error tracking failed:', error);
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

  /**
   * Get share analytics
   */
  function getShareAnalytics() {
    try {
      const shares = JSON.parse(localStorage.getItem('social_shares') || '[]');
      const platformStats = JSON.parse(localStorage.getItem('platform_stats') || '{}');

      const totalShares = shares.length;
      const successfulShares = shares.filter(s => s.status === 'success').length;
      const failedShares = shares.filter(s => s.status === 'error').length;
      const successRate = totalShares > 0 ? (successfulShares / totalShares * 100).toFixed(1) : 0;

      // Get most shared platforms
      const platformCounts = {};
      shares.forEach(share => {
        platformCounts[share.platform] = (platformCounts[share.platform] || 0) + 1;
      });

      const popularPlatforms = Object.entries(platformCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([platform, count]) => ({ platform, count }));

      // Get recent shares (last 50)
      const recentShares = shares.slice(-50).reverse();

      return {
        totalShares,
        successfulShares,
        failedShares,
        successRate: successRate + '%',
        platformStats,
        popularPlatforms,
        recentShares
      };
    } catch (error) {
      console.warn('Failed to get share analytics:', error);
      return null;
    }
  }

  /**
   * Clear share analytics
   */
  function clearShareAnalytics() {
    try {
      localStorage.removeItem('social_shares');
      localStorage.removeItem('platform_stats');
      return true;
    } catch (error) {
      console.warn('Failed to clear share analytics:', error);
      return false;
    }
  }

  // Export functions for global access
  window.socialSharing = {
    shareToFacebook,
    shareToTwitter,
    shareToLinkedIn,
    shareToPinterest,
    shareToWhatsApp,
    shareToInstagram,
    copyToClipboard,
    updateMetaTags,
    initLightboxSharing,
    initInstagramFeed,
    getShareAnalytics,
    clearShareAnalytics,
    config: socialConfig
  };
})();

