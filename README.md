# Convert to Readable Spokable PDF

A modern, client-side web application that transforms PDFs into TTS-friendly, spoken-language documents optimized for text-to-speech consumption.

## Features

-   **PDF Text Extraction**: Extract selectable text from PDFs (no OCR required)
-   **Intelligent Transformation**: Convert code, tables, figures, formulas, and URLs into natural spoken language
-   **Gemini API Integration**: Uses Google AI Studio / Gemini REST API for AI-powered transformations
-   **Batch Processing**: Smart chunking with configurable token limits and overlap
-   **Model Failover**: Automatic fallback between multiple Gemini models
-   **Offline Support**: IndexedDB storage for PDFs and processing state
-   **Progress Tracking**: Real-time progress with pause/resume capability
-   **In-Browser TTS**: Optional voice playback of transformed content
-   **Multimodal Support**: Send figures to Gemini for enhanced descriptions
-   **Dark Mode**: Beautiful light/dark theme toggle
-   **Fully Client-Side**: No server required, deploy anywhere

## Quick Start

1. Open `index.html` in a modern browser
2. Get a Google AI Studio API key from https://aistudio.google.com/app/apikey
3. Enter your API key in Settings
4. Upload a PDF and click "Convert to Spokable PDF"
5. Download your transformed, TTS-friendly PDF

## Project Structure

```
├── index.html              # Main conversion page
├── about.html              # About page
├── privacy.html            # Privacy policy
├── faq.html               # FAQ page
├── terms.html             # Terms of service
├── contact.html           # Contact page
├── pricing.html           # Pricing information
├── js/
│   ├── main.js            # Main application controller
│   ├── file-handler.js    # File upload and drag-drop
│   ├── pdf-extractor.js   # PDF text extraction
│   ├── chunking.js        # Text chunking with overlap
│   ├── api-client.js      # Gemini REST API client
│   ├── retry-manager.js   # Retry logic and failover
│   ├── pdf-generator.js   # Output PDF generation
│   ├── ui.js              # UI updates and progress
│   ├── settings.js        # Settings management
│   ├── db.js              # IndexedDB wrapper
│   ├── tts-player.js      # In-browser TTS playback
│   └── utils.js           # Utility functions
├── css/
│   ├── main.css           # Main styles
│   ├── theme.css          # Theme variables
│   └── components.css     # Component styles
├── assets/
│   └── icons/             # Icons and images
└── README.md              # This file
```

## Developer Guide

### Updating Model Lists

Edit `js/api-client.js` and modify the `AVAILABLE_MODELS` constant:

```javascript
const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', ... },
  // Add new models here
];
```

### Changing API Endpoints

Edit `js/api-client.js` and update the `API_BASE_URL` constant and request format in `callGeminiAPI()`.

### Customizing Prompts

Default prompts are in `js/settings.js` under `DEFAULT_SETTINGS.prompts`. Users can edit these in the Settings UI.

### Adding New Providers

1. Create a new provider module in `js/` (e.g., `cerebras-client.js`)
2. Implement the same interface as `api-client.js`
3. Add provider selection in Settings UI
4. Update retry-manager.js to handle the new provider

## Deployment

### Static Hosting (GitHub Pages, Netlify, Vercel)

Simply upload all files to your hosting provider. No build step required.

### Single-File Build

Use `build-single.html` for a completely self-contained version (all JS/CSS inlined).

## Security & Privacy

-   API keys are stored only in browser localStorage
-   PDFs are stored only in browser IndexedDB
-   All processing happens client-side
-   Data is sent only to Google AI Studio API (user-controlled)
-   No tracking or analytics by default

## Browser Requirements

-   Modern browser with ES6+ support
-   IndexedDB support
-   Fetch API support
-   Recommended: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Testing

Open the test page at `test.html` to run sample conversions and measure performance.

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, visit the Contact page or open an issue on GitHub.
