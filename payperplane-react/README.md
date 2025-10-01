# PayperPlane React App

This is the React version of the PayperPlane landing page, converted from the original HTML/CSS/JavaScript implementation.

## Project Structure

```
payperplane-react/
├── src/
│   ├── components/          # HTML components split from original file
│   │   ├── message-box/     # Message notification component
│   │   ├── header/          # Navigation header
│   │   ├── hero/            # Main hero section
│   │   ├── awards/          # Awards section
│   │   ├── best-suited/     # Target audience section
│   │   ├── solutions/       # Solutions section
│   │   ├── stats/           # Statistics section
│   │   ├── wallet/          # Supported wallets section
│   │   ├── faq/             # FAQ accordion section
│   │   └── footer/          # Footer section
│   ├── App.jsx              # Main app that loads all components
│   └── main.jsx             # Entry point
├── public/
│   ├── files/               # All CSS and image assets
│   └── example.js           # Original JavaScript functionality
├── index.html               # Root HTML file
├── package.json             # Dependencies
└── vite.config.js           # Vite configuration
```

## What Was Cleaned Up

- Removed `public/example-body.html` - No longer needed as content is split into components
- Removed `public/example.html` - Original file that was split into components
- Each section now lives in its own HTML file under `src/components/`

## How It Works

1. The App.jsx loads each HTML component file dynamically
2. Components are inserted using React's `dangerouslySetInnerHTML`
3. Original CSS and JavaScript are preserved and work exactly as before
4. The exact HTML structure from the original file is maintained

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Editing Components

Each component can be edited independently:
- `src/components/header/header.html` - Edit navigation
- `src/components/hero/hero.html` - Edit main hero section
- `src/components/faq/faq.html` - Edit FAQ items
- etc.

The original styling is preserved in `public/files/app.css` and `public/files/main-new-page.css`.