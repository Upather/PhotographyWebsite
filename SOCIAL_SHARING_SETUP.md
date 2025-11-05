# Social Sharing & Integration Setup Guide

This guide explains how to configure and use the social sharing features implemented for the photography portfolio.

## Features Implemented

### 1. Social Media Sharing Buttons
- **Location**: Appears in the lightbox when viewing individual portfolio images
- **Platforms Supported**: Facebook, Twitter, Pinterest, Instagram
- **Copy Link**: Generate and copy customizable shareable URLs

### 2. Open Graph & Twitter Card Meta Tags
- Automatically updates when sharing images
- Provides rich previews when links are shared on social media
- Includes image, title, description, and URL

### 3. Copy Image Link Functionality
- Customizable URLs with image parameters
- Format: `yourdomain.com?image=IMAGE_URL&title=IMAGE_TITLE`
- One-click copy to clipboard with visual feedback

### 4. Instagram Feed Integration
- Section added to the main page
- Ready for Instagram API integration
- Placeholder structure for easy customization

## Configuration

### Update Instagram Username

Edit `assets/js/social-sharing.js` and update the `instagramUsername`:

```javascript
const sharingConfig = {
  siteUrl: window.location.origin,
  siteName: 'Professional Fashion Photography',
  defaultImage: window.location.origin + '/assets/images/default-share.jpg',
  instagramUsername: 'your-instagram-username', // ← Update this
  facebookAppId: '', // Optional: Add if you have a Facebook App ID
};
```

### Update Instagram Profile Link

Edit `index.html` and update the Instagram link in the Instagram Feed section:

```html
<a href="https://www.instagram.com/your-username" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
  View on Instagram
</a>
```

## Instagram Feed Integration Options

### Option 1: Instagram Basic Display API
1. Create a Facebook App at https://developers.facebook.com/
2. Add Instagram Basic Display product
3. Get access token and user ID
4. Update `initInstagramFeed()` function in `social-sharing.js` with API calls

### Option 2: Third-Party Services
- **SnapWidget**: https://snapwidget.com/
- **Juicer**: https://www.juicer.io/
- **Elfsight**: https://elfsight.com/

### Option 3: Instagram Graph API (Business Accounts)
1. Convert to Instagram Business Account
2. Connect to Facebook Page
3. Use Instagram Graph API to fetch posts
4. Update `initInstagramFeed()` function accordingly

## Customization

### Changing Share Button Colors
Edit `assets/css/styles.css`:

```css
.share-facebook:hover {
  background: #1877f2; /* Facebook blue */
}

.share-twitter:hover {
  background: #1da1f2; /* Twitter blue */
}

.share-pinterest:hover {
  background: #bd081c; /* Pinterest red */
}
```

### Customizing Share Messages
Edit the `getShareUrl()` function in `social-sharing.js` to customize share text:

```javascript
twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=${sharingConfig.instagramUsername}`,
```

### Adding More Platforms
To add additional social platforms:

1. Add a new button in `createSocialShareButtons()` function
2. Add corresponding CSS styles
3. Add share URL generation in `getShareUrl()` function

## Testing

1. **Test Social Sharing**: 
   - Open a portfolio image in the lightbox
   - Click share buttons to verify they open correctly
   - Test copy link functionality

2. **Test Meta Tags**:
   - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Use Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Check that images and descriptions appear correctly

3. **Test Instagram Feed**:
   - Verify the Instagram section appears on the page
   - Update with actual API integration when ready

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Clipboard API requires HTTPS (or localhost for development)
- Fallback copy method for older browsers

## Security Notes

- All external links use `rel="noopener noreferrer"`
- Share URLs are properly encoded
- Content Security Policy allows necessary social media domains

## Troubleshooting

### Share buttons not appearing
- Check browser console for JavaScript errors
- Verify `social-sharing.js` is loaded (check Network tab)
- Ensure lightbox is properly initialized

### Meta tags not updating
- Clear browser cache
- Use social media debugging tools to refresh cache
- Check that `updateMetaTags()` is being called

### Copy link not working
- Ensure site is served over HTTPS (required for clipboard API)
- Check browser console for errors
- Verify clipboard permissions are granted

## Support

For issues or questions, refer to:
- Instagram API Documentation: https://developers.facebook.com/docs/instagram-basic-display-api
- Twitter Cards Documentation: https://developer.twitter.com/en/docs/twitter-for-websites/cards
- Open Graph Protocol: https://ogp.me/

