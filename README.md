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

## Social Sharing Features

The portfolio includes social sharing functionality for individual images:

### Features
- **Social Media Sharing**: Share images to Facebook, Twitter, Pinterest, and Instagram
- **Copy Link**: Copy shareable URLs for individual portfolio images
- **Open Graph & Twitter Cards**: Enhanced meta tags for better social media previews
- **Instagram Feed Integration**: Optional Instagram gallery embedding

### Configuration

#### Social Sharing URLs
Edit `assets/js/social-sharing.js` to customize:
- `baseUrl`: Your website's base URL for shareable links
- `defaultTitle`: Default title for shared content
- `defaultDescription`: Default description for shared content

#### Instagram Feed Setup
To enable the Instagram feed section:

1. Get an Instagram Access Token:
   - Use Instagram Basic Display API or Instagram Graph API
   - For Graph API: Create a Facebook App and get an access token
   - Add the token to `assets/js/social-sharing.js` in the `config` object:
     ```javascript
     instagramAccessToken: 'YOUR_ACCESS_TOKEN_HERE'
     ```

2. The feed will automatically load and display your latest Instagram posts.

**Note**: Instagram API requires authentication and proper setup. The feed section will show a placeholder message if the token is not configured.

### Custom Shareable URLs
Images can be shared with custom URLs in the format: `yourdomain.com#image/{imageId}`. When someone visits this URL, the corresponding image will automatically open in the lightbox.

## Structure

```
PhotographyProject/
  index.html
  assets/
    css/styles.css
    js/script.js
    images/ (add your images here)
```

## License

For your personal/portfolio use. Replace all imagery with assets you have the rights to use.


