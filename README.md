# Fashion Photographer Portfolio

Responsive, minimal portfolio site for a fashion/editorial photographer. Includes hero, portfolio with filters and lightbox, services, about, and contact form.

## Run locally

- Option 1 (quick): open `index.html` in your browser.
- Option 2 (recommended): serve with a local server for proper routing and caching.

Using PowerShell (Windows):

```powershell
npx serve@latest -l 5173
```

Then visit `http://localhost:5173`.

## Customize

- Text: edit `index.html` copy in each section.
- Branding: update the `logo` text and colors in `assets/css/styles.css` (CSS variables in `:root`).
- Images: replace Unsplash URLs in `index.html` with your local files under `assets/images/`.
- Favicon: place a `favicon.png` under `assets/images/` and ensure the link tag in `index.html` points to it.
- Contact form: replace the `action` attribute (Formspree demo) with your preferred backend or service.

## Admin (upload and reorder gallery)

This project uses Firebase for the admin panel. Steps:

1) Create a Firebase project at `https://console.firebase.google.com`.
2) Add a Web app and copy the SDK config.
3) Enable Authentication (Email/Password) and create your admin user.
4) Enable Firestore (production mode) and Storage.
5) Copy `assets/js/config.example.js` to `assets/js/config.js` and paste your config values.
6) Open `admin.html` to log in and upload images.

Recommended security rules (adjust to your project):

Firestore (`Rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gallery/{docId} {
      allow read: if true; // public gallery read
      allow write: if request.auth != null; // only authenticated users
    }
  }
}
```

Storage (`Rules`):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /gallery/{allPaths=**} {
      allow read: if true; // public images
      allow write: if request.auth != null; // only authenticated users
    }
  }
}
```

Public site will auto-load images from Firestore if `assets/js/config.js` is present; otherwise it shows the built-in placeholders.

## Progressive Web App (PWA) Features

This portfolio includes full PWA support for offline functionality and mobile app-like experience:

### Features
- **Offline Support**: Service worker caches essential assets and images for offline viewing
- **Installable**: Users can install the site as a native app on mobile devices
- **Performance Monitoring**: Tracks Core Web Vitals (LCP, FID, CLS) and page load metrics
- **Enhanced Image Loading**: Advanced lazy loading with IntersectionObserver and progressive image loading
- **Responsive Images**: Automatic srcset generation for better performance on different devices

### PWA Icons
To complete the PWA setup, add the following icon sizes to `assets/images/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

You can generate these from a single high-resolution image using online tools or image editing software.

### Testing PWA Features
1. Open the site in Chrome/Edge
2. Open DevTools → Application → Service Workers to verify registration
3. Test offline mode: DevTools → Network → Offline
4. Check install prompt: Look for install banner or browser install button

## Performance Optimizations

The site includes several performance optimizations:

- **Lazy Loading**: Images load only when entering viewport
- **Image Optimization**: Placeholder images reduce layout shift
- **Caching Strategy**: Service worker implements cache-first for images, network-first for HTML
- **Resource Hints**: DNS prefetch and preconnect for external resources
- **Content Visibility**: CSS content-visibility for off-screen content
- **Reduced Motion**: Respects user's prefers-reduced-motion preference

## Structure

```
PhotographyProject/
  index.html
  manifest.json          # PWA manifest
  sw.js                  # Service worker
  assets/
    css/styles.css
    js/
      script.js          # Main site functionality
      gallery.js         # Gallery with enhanced lazy loading
      performance.js     # Performance monitoring
      pwa.js            # PWA registration and features
      seo.js            # SEO enhancements
    images/ (add your images here)
```

## License

For your personal/portfolio use. Replace all imagery with assets you have the rights to use.


