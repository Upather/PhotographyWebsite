/* Social Sharing & Integration Module */
(function () {
  'use strict';

  // Configuration - customize these URLs
  const config = {
    baseUrl: window.location.origin + window.location.pathname, // Current page URL for sharing
    defaultTitle: 'Professional Fashion Photography',
    defaultDescription: 'Professional fashion photography services for SA Fashion Week, Soweto Fashion Week, and exclusive bookings.',
    instagramUsername: '', // Add your Instagram username here
    instagramAccessToken: '', // For Instagram API integration - get from Instagram Basic Display API or Graph API
  };

  /**
   * Social Sharing Functions
   */
  const socialShare = {
    facebook: function (url, text) {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
    },

    twitter: function (url, text) {
      const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
    },

    pinterest: function (url, imageUrl, text) {
      const shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
    },

    instagram: function (imageUrl, caption) {
      // Instagram doesn't allow direct sharing via URL, so we'll copy the image URL
      // and show instructions, or open Instagram's web share if available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [] })) {
        // For mobile devices with native share
        navigator.share({
          title: caption || 'Check out this image',
          text: caption || '',
          url: imageUrl
        }).catch(err => console.log('Error sharing', err));
      } else {
        // Fallback: copy image URL and show message
        copyToClipboard(imageUrl);
        showNotification('Image URL copied! You can paste it in Instagram.');
      }
    },

    copyLink: function (url) {
      copyToClipboard(url);
      showNotification('Link copied to clipboard!');
    }
  };

  /**
   * Copy text to clipboard
   */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy:', err);
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
  }

  /**
   * Fallback copy method for older browsers
   */
  function fallbackCopyToClipboard(text) {
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
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
  }

  /**
   * Show notification toast
   */
  function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.share-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Generate shareable URL for an image
   */
  function generateImageUrl(imageId, imageUrl) {
    // Custom URL format: baseUrl#image/{id}
    // You can customize this format
    return `${config.baseUrl}#image/${imageId}`;
  }

  /**
   * Update Open Graph and Twitter Card meta tags for an image
   */
  function updateMetaTags(imageData) {
    const imageUrl = imageData.url || '';
    const title = imageData.metadata?.title || imageData.caption || config.defaultTitle;
    const description = imageData.metadata?.description || imageData.caption || config.defaultDescription;
    const imageId = imageData.id || '';

    // Generate shareable URL
    const shareableUrl = imageId ? generateImageUrl(imageId, imageUrl) : config.baseUrl;

    const metaTags = {
      // Open Graph
      'og:url': shareableUrl,
      'og:type': 'article',
      'og:title': title,
      'og:description': description,
      'og:image': imageUrl,
      'og:image:secure_url': imageUrl,
      'og:image:type': 'image/jpeg',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': imageData.metadata?.altText || title,

      // Twitter Card
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': imageUrl,
      'twitter:image:alt': imageData.metadata?.altText || title,
    };

    // Update or create meta tags
    Object.entries(metaTags).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        // Use 'property' for og: tags, 'name' for twitter: tags
        if (property.startsWith('og:')) {
          meta.setAttribute('property', property);
        } else if (property.startsWith('twitter:')) {
          meta.setAttribute('name', property);
        } else {
          meta.setAttribute('property', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    });

    // Update canonical URL if image-specific
    if (imageId) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', shareableUrl);
    }
  }

  /**
   * Create social sharing buttons for lightbox
   */
  function createSocialButtons(imageData) {
    const container = document.createElement('div');
    container.className = 'social-share-buttons';

    const imageUrl = imageData.url || '';
    const title = imageData.metadata?.title || imageData.caption || config.defaultTitle;
    const imageId = imageData.id || '';
    const shareableUrl = imageId ? generateImageUrl(imageId, imageUrl) : config.baseUrl;

    const buttons = [
      {
        platform: 'facebook',
        label: 'Share on Facebook',
        icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
        action: () => socialShare.facebook(shareableUrl, title)
      },
      {
        platform: 'twitter',
        label: 'Share on Twitter',
        icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
        action: () => socialShare.twitter(shareableUrl, title)
      },
      {
        platform: 'pinterest',
        label: 'Pin on Pinterest',
        icon: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z',
        action: () => socialShare.pinterest(shareableUrl, imageUrl, title)
      },
      {
        platform: 'instagram',
        label: 'Share on Instagram',
        icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
        action: () => socialShare.instagram(imageUrl, title)
      },
      {
        platform: 'copy',
        label: 'Copy Link',
        icon: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
        action: () => socialShare.copyLink(shareableUrl)
      }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `social-share-btn social-share-btn-${btn.platform}`;
      button.setAttribute('aria-label', btn.label);
      button.setAttribute('title', btn.label);
      
      button.innerHTML = `
        <svg class="social-share-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="${btn.icon}"/>
        </svg>
        <span class="social-share-label">${btn.platform === 'copy' ? 'Copy Link' : btn.platform}</span>
      `;
      
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.action();
      });

      container.appendChild(button);
    });

    return container;
  }

  /**
   * Initialize social sharing for lightbox
   */
  function initLightboxSharing() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    // Add social sharing container to lightbox
    let shareContainer = lightbox.querySelector('.social-share-container');
    if (!shareContainer) {
      shareContainer = document.createElement('div');
      shareContainer.className = 'social-share-container';
      lightbox.appendChild(shareContainer);
    }

    // Hook into lightbox opening - use a MutationObserver or polling
    // Since script.js already handles this, we'll just ensure container exists
    // and update buttons when lightbox opens
    const observer = new MutationObserver(() => {
      if (lightbox.classList.contains('open')) {
        const currentImage = window.currentLightboxImage ? window.currentLightboxImage() : null;
        if (currentImage) {
          // Update meta tags
          updateMetaTags(currentImage);

          // Update social sharing buttons
          const existingButtons = shareContainer.querySelector('.social-share-buttons');
          if (existingButtons) existingButtons.remove();
          
          const buttons = createSocialButtons(currentImage);
          shareContainer.appendChild(buttons);
        }
      }
    });

    observer.observe(lightbox, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /**
   * Instagram Feed Integration
   */
  function initInstagramFeed() {
    const feedContainer = document.getElementById('instagram-feed');
    if (!feedContainer || !config.instagramAccessToken) return;

    // This would require Instagram Basic Display API or Graph API
    // For now, we'll create a placeholder structure
    fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url&access_token=${config.instagramAccessToken}`)
      .then(response => response.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          renderInstagramFeed(data.data, feedContainer);
        }
      })
      .catch(err => {
        console.warn('Instagram feed not available:', err);
        // Show placeholder or fallback content
        feedContainer.innerHTML = '<p class="muted">Instagram feed will appear here. Configure your access token in social-sharing.js</p>';
      });
  }

  function renderInstagramFeed(media, container) {
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'instagram-feed-grid';

    media.slice(0, 6).forEach(item => {
      const link = document.createElement('a');
      link.href = item.permalink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'instagram-feed-item';

      const img = document.createElement('img');
      img.src = item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url;
      img.alt = item.caption || 'Instagram post';
      img.loading = 'lazy';

      link.appendChild(img);
      grid.appendChild(link);
    });

    container.appendChild(grid);
  }

  /**
   * Handle hash-based image URLs (#image/id)
   */
  function handleImageHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#image/')) {
      const imageId = hash.replace('#image/', '');
      // Find and open the image in lightbox
      const item = document.querySelector(`[data-image-id="${imageId}"]`);
      if (item) {
        item.click();
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLightboxSharing();
      initInstagramFeed();
      handleImageHash();
    });
  } else {
    initLightboxSharing();
    initInstagramFeed();
    handleImageHash();
  }

  // Handle hash changes
  window.addEventListener('hashchange', handleImageHash);

  // Export for global access
  window.socialSharing = {
    updateMetaTags,
    createSocialButtons,
    share: socialShare,
    config
  };

})();

