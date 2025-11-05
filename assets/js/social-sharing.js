// Social Sharing & Integration Module
(function () {
  'use strict';

  // Social sharing configuration
  const sharingConfig = {
    siteUrl: window.location.origin,
    siteName: 'Professional Fashion Photography',
    defaultImage: window.location.origin + '/assets/images/default-share.jpg',
    instagramUsername: 'photographer', // Update with actual Instagram username
    facebookAppId: '', // Optional: Add Facebook App ID if needed
  };

  /**
   * Update Open Graph and Twitter Card meta tags for shared images
   */
  function updateMetaTags(imageUrl, imageTitle, imageDescription) {
    const title = imageTitle || 'Professional Fashion Photography';
    const description = imageDescription || 'Capturing the essence of African fashion at SA Fashion Week and Soweto Fashion Week';
    const url = window.location.href;
    const image = imageUrl || sharingConfig.defaultImage;

    // Update or create Open Graph tags
    const ogTags = {
      'og:title': title,
      'og:description': description,
      'og:image': image,
      'og:url': url,
      'og:type': 'article',
      'og:site_name': sharingConfig.siteName,
    };

    // Update or create Twitter Card tags
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
      'twitter:url': url,
    };

    // Update existing or create new meta tags
    Object.entries({ ...ogTags, ...twitterTags }).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        const isTwitter = property.startsWith('twitter:');
        if (isTwitter) {
          meta.setAttribute('name', property);
        } else {
          meta.setAttribute('property', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });
  }

  /**
   * Generate share URLs for different platforms
   */
  function getShareUrl(platform, imageUrl, title, description) {
    const encodedUrl = encodeURIComponent(window.location.href);
    const encodedTitle = encodeURIComponent(title || 'Professional Fashion Photography');
    const encodedDescription = encodeURIComponent(description || '');
    const encodedImage = encodeURIComponent(imageUrl || '');

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=${sharingConfig.instagramUsername}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
      // Instagram requires manual sharing (no direct URL)
      instagram: 'https://www.instagram.com/' + sharingConfig.instagramUsername,
    };

    return shareUrls[platform] || '';
  }

  /**
   * Copy image link to clipboard
   */
  function copyImageLink(imageUrl, customUrl = null) {
    const urlToCopy = customUrl || imageUrl || window.location.href;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlToCopy).then(() => {
        showCopyNotification('Link copied to clipboard!');
      }).catch(() => {
        fallbackCopyToClipboard(urlToCopy);
      });
    } else {
      fallbackCopyToClipboard(urlToCopy);
    }
  }

  /**
   * Fallback copy method for older browsers
   */
  function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showCopyNotification('Link copied to clipboard!');
    } catch (err) {
      showCopyNotification('Failed to copy. Please copy manually.', true);
    }
    document.body.removeChild(textArea);
  }

  /**
   * Show copy notification
   */
  function showCopyNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'share-notification' + (isError ? ' error' : '');
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }

  /**
   * Create social sharing buttons for lightbox
   */
  function createSocialShareButtons(imageUrl, imageTitle, imageDescription) {
    const shareContainer = document.createElement('div');
    shareContainer.className = 'lightbox-share';
    shareContainer.innerHTML = `
      <div class="share-buttons">
        <button class="share-btn share-facebook" aria-label="Share on Facebook" title="Share on Facebook">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </button>
        <button class="share-btn share-twitter" aria-label="Share on Twitter" title="Share on Twitter">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          <span>Twitter</span>
        </button>
        <button class="share-btn share-pinterest" aria-label="Share on Pinterest" title="Share on Pinterest">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12c5.084 0 9.426-3.138 11.174-7.637-.15-.831-.085-1.85.344-2.77.438-.923 1.163-1.75 1.163-3.151 0-2.236-1.365-3.896-3.32-3.896-1.02 0-1.892.42-2.22 1.01-.442-.989-1.09-1.86-1.85-2.5C15.937 1.737 14.01.5 11.5.5c-4.4 0-7.5 3.2-7.5 7.5 0 1.8.5 3.2 1.5 3.8.4.2.7.1.8-.2.1-.3.3-1 .4-1.3.1-.4.1-.5-.3-.8-.5-.5-1-1.4-1-2.5 0-2.9 2.1-5.5 5.5-5.5 3 0 4.7 1.8 4.7 4.2 0 2.3-1.4 4.2-3.4 4.2-1.1 0-1.9-.6-1.9-1.4 0-1.1.8-2.2 2-2.2.7 0 1.3.3 1.3.7 0 .5-.4 1.3-.5 2-.1.5-.2 1-.2 1.5 0 .6.3 1.1.9 1.1 1.1 0 2-1.2 2-2.9 0-2.5-1.8-4.7-4.5-4.7-3.1 0-5.1 2.3-5.1 4.8 0 .9.3 1.5.8 2 .2.2.3.3.2.6-.1.2-.2.6-.3.8-.1.3-.2.4-.5.3-1.4-.6-2.2-2.5-2.2-4 0-3.3 2.4-6.3 6.7-6.3 3.5 0 6.2 2.5 6.2 5.9 0 3.8-2.3 6.8-5.6 6.8-1.1 0-2.2-.6-2.6-1.3l-.7 2.7c-.2.8-.8 1.8-1.2 2.4.9.3 1.9.4 2.9.4 6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
          <span>Pinterest</span>
        </button>
        <button class="share-btn share-instagram" aria-label="View on Instagram" title="View on Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
          <span>Instagram</span>
        </button>
        <button class="share-btn share-copy" aria-label="Copy image link" title="Copy image link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>Copy Link</span>
        </button>
      </div>
    `;

    // Add event listeners
    const facebookBtn = shareContainer.querySelector('.share-facebook');
    const twitterBtn = shareContainer.querySelector('.share-twitter');
    const pinterestBtn = shareContainer.querySelector('.share-pinterest');
    const instagramBtn = shareContainer.querySelector('.share-instagram');
    const copyBtn = shareContainer.querySelector('.share-copy');

    facebookBtn?.addEventListener('click', () => {
      const url = getShareUrl('facebook', imageUrl, imageTitle, imageDescription);
      window.open(url, '_blank', 'width=600,height=400');
    });

    twitterBtn?.addEventListener('click', () => {
      const url = getShareUrl('twitter', imageUrl, imageTitle, imageDescription);
      window.open(url, '_blank', 'width=600,height=400');
    });

    pinterestBtn?.addEventListener('click', () => {
      const url = getShareUrl('pinterest', imageUrl, imageTitle, imageDescription);
      window.open(url, '_blank', 'width=600,height=400');
    });

    instagramBtn?.addEventListener('click', () => {
      const url = getShareUrl('instagram', imageUrl, imageTitle, imageDescription);
      window.open(url, '_blank');
    });

    copyBtn?.addEventListener('click', () => {
      // Generate customizable URL for sharing
      const shareUrl = `${window.location.origin}${window.location.pathname}?image=${encodeURIComponent(imageUrl)}&title=${encodeURIComponent(imageTitle || '')}`;
      copyImageLink(imageUrl, shareUrl);
    });

    return shareContainer;
  }

  /**
   * Initialize social sharing for lightbox
   */
  function initLightboxSharing() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    // Check if share buttons already exist
    if (lightbox.querySelector('.lightbox-share')) return;

    // Function to add sharing buttons when lightbox opens
    function addSharingButtons() {
      const lightboxImg = lightbox.querySelector('.lightbox-image');
      const lightboxCap = lightbox.querySelector('.lightbox-caption');
      
      if (lightboxImg && lightboxImg.src && !lightbox.querySelector('.lightbox-share')) {
        const imageUrl = lightboxImg.src;
        const imageTitle = lightboxCap?.textContent || '';
        
        // Update meta tags
        updateMetaTags(imageUrl, imageTitle, 'Professional fashion photography');
        
        // Create and add share buttons
        const shareButtons = createSocialShareButtons(imageUrl, imageTitle, 'Professional fashion photography');
        lightbox.appendChild(shareButtons);
      }
    }

    // Function to remove sharing buttons when lightbox closes
    function removeSharingButtons() {
      const shareContainer = lightbox.querySelector('.lightbox-share');
      if (shareContainer) {
        shareContainer.remove();
      }
    }

    // Observe lightbox opens to add sharing buttons
    const observer = new MutationObserver(() => {
      const isOpen = lightbox.classList.contains('open') && lightbox.getAttribute('aria-hidden') === 'false';
      
      if (isOpen) {
        // Small delay to ensure image is loaded
        setTimeout(addSharingButtons, 100);
      } else {
        removeSharingButtons();
      }
    });

    observer.observe(lightbox, {
      attributes: true,
      attributeFilter: ['aria-hidden', 'class'],
      childList: true,
      subtree: true,
    });

    // Also listen for direct clicks on portfolio items (backup)
    document.addEventListener('click', (e) => {
      const portfolioItem = e.target.closest('.portfolio-item');
      if (portfolioItem) {
        setTimeout(addSharingButtons, 300);
      }
    });
  }

  /**
   * Initialize Instagram feed embedding
   */
  function initInstagramFeed() {
    const instagramGrid = document.getElementById('instagram-feed-grid');
    if (!instagramGrid) return;

    // This is a placeholder for Instagram feed integration
    // In production, you would use Instagram Basic Display API or a service like SnapWidget
    // For now, we'll create a placeholder structure that can be replaced with actual API calls
    
    // Example integration structure:
    // 1. Use Instagram Basic Display API (requires OAuth setup)
    // 2. Use a third-party service like SnapWidget or Juicer
    // 3. Use Instagram Graph API (for business accounts)
    
    // Placeholder message
    if (instagramGrid.children.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'instagram-feed-container';
      placeholder.style.gridColumn = '1 / -1';
      placeholder.innerHTML = `
        <p class="instagram-placeholder">Connect your Instagram account to display your latest posts here.</p>
        <p class="instagram-info">To enable Instagram feed, configure Instagram Basic Display API in your settings.</p>
        <p class="instagram-info" style="margin-top: 8px; font-size: 13px;">
          Update the <code>instagramUsername</code> in <code>social-sharing.js</code> and integrate with your preferred Instagram API.
        </p>
      `;
      instagramGrid.appendChild(placeholder);
    }

    // Example: If you have Instagram API access, you could fetch posts like this:
    /*
    async function fetchInstagramPosts() {
      try {
        const response = await fetch('YOUR_INSTAGRAM_API_ENDPOINT');
        const posts = await response.json();
        
        instagramGrid.innerHTML = '';
        posts.forEach(post => {
          const item = document.createElement('a');
          item.href = post.permalink;
          item.target = '_blank';
          item.rel = 'noopener noreferrer';
          item.className = 'instagram-feed-item';
          item.innerHTML = `<img src="${post.media_url}" alt="${post.caption || 'Instagram post'}" loading="lazy" />`;
          instagramGrid.appendChild(item);
        });
      } catch (error) {
        console.error('Failed to fetch Instagram posts:', error);
      }
    }
    */
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

  // Export functions for external use
  window.socialSharing = {
    updateMetaTags,
    copyImageLink,
    getShareUrl,
    config: sharingConfig,
  };
})();

