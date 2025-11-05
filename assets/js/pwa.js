/* Progressive Web App - Service Worker Registration and PWA Features */

(function () {
  'use strict';

  // Register Service Worker
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration.scope);

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // Check every hour

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  showUpdateNotification();
                }
              });
            });
          })
          .catch((error) => {
            console.warn('Service Worker registration failed:', error);
          });
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          showUpdateNotification();
        }
      });
    }
  }

  // Show update notification
  function showUpdateNotification() {
    // Create a simple notification banner
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--text, #1d1d1f);
      color: var(--bg, #ffffff);
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 15px;
      max-width: 90%;
      animation: slideUp 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    banner.innerHTML = `
      <span>New version available</span>
      <button id="pwa-reload-btn" style="
        background: var(--bg, #ffffff);
        color: var(--text, #1d1d1f);
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
      ">Update</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: var(--bg, #ffffff);
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
      ">Dismiss</button>
    `;

    document.body.appendChild(banner);

    const reloadBtn = document.getElementById('pwa-reload-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');

    reloadBtn.addEventListener('click', () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });

    dismissBtn.addEventListener('click', () => {
      banner.remove();
    });
  }

  // Install prompt handling
  let deferredPrompt;
  const installBanner = document.createElement('div');

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    deferredPrompt = e;

    // Show custom install banner
    showInstallBanner();
  });

  function showInstallBanner() {
    if (installBanner.parentNode) return; // Already shown

    installBanner.id = 'pwa-install-banner';
    installBanner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--text, #1d1d1f);
      color: var(--bg, #ffffff);
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    if (!document.getElementById('pwa-install-styles')) {
      style.id = 'pwa-install-styles';
      document.head.appendChild(style);
    }

    installBanner.innerHTML = `
      <div style="flex: 1;">
        <strong>Install App</strong>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">
          Add to home screen for better experience
        </div>
      </div>
      <button id="pwa-install-btn" style="
        background: var(--bg, #ffffff);
        color: var(--text, #1d1d1f);
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        white-space: nowrap;
      ">Install</button>
      <button id="pwa-install-close" style="
        background: transparent;
        color: var(--bg, #ffffff);
        border: none;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    `;

    document.body.appendChild(installBanner);

    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-install-close');

    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('User response to install prompt:', outcome);
        deferredPrompt = null;
        installBanner.remove();
      }
    });

    closeBtn.addEventListener('click', () => {
      installBanner.remove();
      // Store dismissal preference
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (installBanner.parentNode) {
        installBanner.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => installBanner.remove(), 300);
      }
    }, 10000);
  }

  // Check if user previously dismissed install prompt
  window.addEventListener('load', () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneWeek) {
        // Don't show again for a week
        return;
      }
    }
  });

  // Detect if app is running in standalone mode
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  // Add standalone class for styling
  if (isStandalone()) {
    document.documentElement.classList.add('standalone');
  }

  // Initialize
  registerServiceWorker();

  // Expose utility functions
  window.pwaUtils = {
    isStandalone,
    showInstallBanner,
    showUpdateNotification
  };
})();
