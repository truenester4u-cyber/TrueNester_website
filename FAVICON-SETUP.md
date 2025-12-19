# TrueNester Favicon Setup

## Current Implementation

The favicon has been configured with optimized SVG files for all devices:

### Files Created:
- `public/truenester-favicon.svg` - Main favicon (original)
- `public/icon-192.svg` - 192x192 optimized icon
- `public/icon-512.svg` - 512x512 optimized icon  
- `public/apple-touch-icon.svg` - iOS-specific icon
- `public/browserconfig.xml` - Windows tile configuration
- `public/manifest.json` - Updated with icon references

### Configuration:
All necessary meta tags and link tags have been added to `index.html`:
- Standard favicons
- Apple touch icons (iOS)
- Safari pinned tab
- Android/Chrome support
- Windows tiles
- PWA manifest

## For Production: PNG Conversion (Recommended)

**Note:** iOS Safari sometimes doesn't display SVG favicons properly in the tab view. For optimal compatibility, convert the SVG files to PNG format.

### Required PNG Sizes:
- `apple-touch-icon.png` - 180x180px (iOS home screen)
- `icon-192.png` - 192x192px (Android)
- `icon-512.png` - 512x512px (PWA splash)
- `favicon-32x32.png` - 32x32px (desktop browsers)
- `favicon-16x16.png` - 16x16px (desktop browsers)

### Conversion Methods:

#### Option 1: Online Tools
1. Visit https://realfavicongenerator.net/
2. Upload `public/truenester-favicon.svg`
3. Download and replace files in `/public`

#### Option 2: Command Line (ImageMagick)
```bash
# Install ImageMagick first
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Convert SVG to PNG
convert public/truenester-favicon.svg -resize 180x180 public/apple-touch-icon.png
convert public/icon-192.svg -resize 192x192 public/icon-192.png
convert public/icon-512.svg -resize 512x512 public/icon-512.png
convert public/truenester-favicon.svg -resize 32x32 public/favicon-32x32.png
convert public/truenester-favicon.svg -resize 16x16 public/favicon-16x16.png
```

#### Option 3: Inkscape
```bash
inkscape public/truenester-favicon.svg --export-filename=public/apple-touch-icon.png --export-width=180 --export-height=180
```

### After PNG Conversion:
Update `index.html` link tags to reference PNG files instead of SVG:
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

Update `manifest.json`:
```json
"icons": [
  {
    "src": "/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  }
]
```

## Testing

### Desktop Browsers:
- Chrome/Edge: Check tab and bookmarks
- Firefox: Check tab and bookmarks
- Safari: Check tab and bookmarks

### Mobile Browsers:
- iOS Safari: Check tab view and home screen icon
- Chrome Android: Check tab and home screen
- Samsung Internet: Check tab and home screen

### PWA:
- Install as app and check icon on home screen
- Check splash screen icon

## Troubleshooting

**Issue: Icon not updating**
- Clear browser cache (Ctrl+Shift+Delete)
- Try hard refresh (Ctrl+Shift+R)
- Change version number in URL (?v=6)

**Issue: iOS Safari tab showing generic icon**
- Convert SVG to PNG (see above)
- Ensure proper meta tags are present
- Check file sizes (should be under 500KB each)

**Issue: Android not showing icon**
- Verify manifest.json is accessible
- Check icon paths are absolute (start with /)
- Ensure PNG format for best compatibility
