# PWA Icon Setup Instructions

Your Call of Duty Black Ops website is now a Progressive Web App! To complete the setup, you need to add icon files to the `/icons` directory.

## Required Icon Files

Create the following PNG images and place them in this directory:

### Standard Icons
- **icon-192.png** (192x192 pixels) - Used for most PWA installations
- **icon-512.png** (512x512 pixels) - Used for splash screens on phones

### Maskable Icons (for custom shapes on certain devices)
- **icon-192-maskable.png** (192x192 pixels) - Maskable version
- **icon-512-maskable.png** (512x512 pixels) - Maskable version

### Screenshots (Optional but Recommended)
- **screenshot-540.png** (540x720 pixels) - Mobile app screenshot
- **screenshot-1280.png** (1280x720 pixels) - Desktop/tablet screenshot

### Shortcut Icon (Optional)
- **play-icon.png** (96x96 pixels) - Icon for the "Play" app shortcut

## How to Create Icons

### Option 1: Using Online Tools
- Visit https://www.favicon-generator.org/ or https://convertio.co/
- Upload your Call of Duty Black Ops image
- Generate icons in the required sizes
- Download and place them in this directory

### Option 2: Using Image Editing Software
- Use Photoshop, GIMP, or any image editor
- Resize your image to the required dimensions
- Export as PNG format
- Place in this directory

### Option 3: Using a Design Tool
- Use Figma, Canva, or Adobe XD
- Create a square design (preferably 512x512 or larger)
- Export at each required size as PNG
- Place in this directory

## Icon Design Tips
- Use high contrast for better visibility at small sizes
- Keep the design simple and recognizable
- Include Call of Duty or Black Ops branding
- Consider a dark/gaming aesthetic to match the theme
- For maskable icons, leave padding around the core design

## Testing Your PWA

Once you've added the icons:

1. **Desktop (Chrome/Edge)**:
   - Open the website
   - Click the "Install" button in the address bar
   - App will install with your icon

2. **mobile (Android)**:
   - Open the website in Chrome
   - Tap the menu (three dots) → "Install app"
   - App will install to home screen

3. **iPhone**:
   - Open the website in Safari
   - Tap Share → "Add to Home Screen"
   - App will install with the apple-touch-icon

## File Structure
```
my-Call-of-Duty-Black-Ops-site-2026/
├── index.html
├── manifest.json
├── service-worker.js
├── black ops.jpg
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-192-maskable.png
│   ├── icon-512-maskable.png
│   ├── screenshot-540.png
│   ├── screenshot-1280.png
│   └── play-icon.png
└── README.md
```

## Additional Resources
- https://web.dev/install-prompt/
- https://web.dev/maskable-icon/
- https://web.dev/lighthouse-pwa/

Enjoy your PWA!
