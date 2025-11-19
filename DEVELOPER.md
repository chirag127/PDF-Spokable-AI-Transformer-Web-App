# Developer Guide - Spokable PDF

## Architecture Overview

Spokable PDF is a client-side web application with no backend server. All processing happens in the browser.

### Core Components

1. **File Handler** (`js/file-handler.js`) - Manages file uploads and drag-drop
2. **PDF Extractor** (`js/pdf-extractor.js`) - Extracts text from PDFs using PDF.js
3. **Text Chunker** (`js/chunking.js`) - Splits text into API-friendly chunks
4. **API Client** (`js/api-client.js`) - Calls Google Gemini REST API
5. **Retry Manager** (`js/retry-manager.js`) - Handles retries and model failover
6. **PDF Generator** (`js/pdf-generator.js`) - Creates output PDFs using jsPDF
7. **TTS Player** (`js/tts-player.js`) - In-browser text-to-speech
8. **UI Controller** (`js/ui.js`) - Manages UI updates and progress
9. **Settings** (`js/settings.js`) - Persistent settings management
10. **Database** (`js/db.js`) - IndexedDB wrapper for local storage
11. **Main App** (`js/main.js`) - Application orchestrator

### Data Flow

```
PDF Upload → Extract Text → Classify Elements → Chunk Text →
Transform with AI → Reconcile Chunks → Generate PDF → Download
```

## Customization Guide

### Adding New Models

Edit `js/api-client.js`:

```javascript
const AVAILABLE_MODELS = [
    {
        id: "new-model-id",
        name: "New Model Name",
        description: "Model description",
        contextWindow: 1000000,
        maxOutput: 8192,
    },
    // ... existing models
];
```

### Changing API Endpoints

Edit `js/api-client.js`:

```javascript
const API_BASE_URL = "https://your-api-endpoint.com/v1/models";
```

Update the request format in `generateContent()` method to match your API's schema.

### Customizing Prompts

Default prompts are in `js/settings.js` under `DEFAULT_SETTINGS.prompts`. Users can edit these in the Settings UI.

To change defaults:

```javascript
prompts: {
    system: `Your custom system prompt...`,
    text: `Your custom text transformation prompt...`,
    // ... other prompts
}
```

### Adding New Providers (Cerebras, Groq, etc.)

1. Create a new client module (e.g., `js/cerebras-client.js`)
2. Implement the same interface as `GeminiAPIClient`:
    - `generateContent(prompt, modelId, options)`
    - `extractTextFromResponse(response)`
    - `parseError(error, response)`
3. Update `js/retry-manager.js` to support provider selection
4. Add provider selection UI in Settings

Example structure:

```javascript
class CerebrasAPIClient {
    async generateContent(prompt, modelId, options) {
        // Implement Cerebras API call
    }

    extractTextFromResponse(response) {
        // Parse Cerebras response
    }
}
```

### Modifying Chunking Strategy

Edit `js/chunking.js`:

```javascript
chunkText(text, batchSize, overlapSize) {
    // Implement your custom chunking logic
    // Current implementation: sentence-based with overlap
}
```

### Customizing PDF Output

Edit `js/pdf-generator.js`:

```javascript
async generatePDF(text, filename) {
    // Customize PDF generation
    // Current: jsPDF with configurable fonts, margins, etc.
}
```

## API Integration Details

### Gemini REST API

**Endpoint Format:**

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
```

**Headers:**

```
Content-Type: application/json
x-goog-api-key: YOUR_API_KEY
```

**Request Body:**

```json
{
    "contents": [
        {
            "parts": [
                {
                    "text": "Your prompt here"
                }
            ]
        }
    ],
    "generationConfig": {
        "temperature": 0.7,
        "topP": 0.95,
        "topK": 40,
        "maxOutputTokens": 2048
    }
}
```

**Response:**

```json
{
    "candidates": [
        {
            "content": {
                "parts": [
                    {
                        "text": "Generated response"
                    }
                ]
            }
        }
    ],
    "usageMetadata": {
        "promptTokenCount": 100,
        "candidatesTokenCount": 200,
        "totalTokenCount": 300
    }
}
```

### Error Handling

The app handles:

-   401/403: Authentication errors
-   429: Rate limiting (respects Retry-After header)
-   500/503: Server errors (triggers model failover)
-   Timeout: Configurable timeout with abort controller

## Testing

### Manual Testing

1. Open `index.html` in a browser
2. Open browser DevTools (F12)
3. Check Console for logs
4. Test with sample PDFs

### Test Checklist

-   [ ] File upload (drag-drop and file picker)
-   [ ] Multiple file selection
-   [ ] Settings persistence (reload page)
-   [ ] API key validation
-   [ ] Conversion with different models
-   [ ] Turbo mode (parallel processing)
-   [ ] Pause/resume functionality
-   [ ] Partial download
-   [ ] Final PDF download
-   [ ] TTS playback
-   [ ] Dark mode toggle
-   [ ] Error handling (invalid API key, network errors)
-   [ ] Browser compatibility

### Creating Test PDFs

Use online tools or LaTeX to create test PDFs with:

-   Plain text paragraphs
-   Code blocks
-   Tables
-   Mathematical formulas
-   Images/figures

## Deployment

### Static Hosting (Recommended)

1. **GitHub Pages:**

    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/username/spokable-pdf.git
    git push -u origin main
    ```

    Enable GitHub Pages in repository settings.

2. **Netlify:**

    - Drag and drop the project folder to Netlify
    - Or connect GitHub repository

3. **Vercel:**
    ```bash
    npm install -g vercel
    vercel
    ```

### Single-File Build

To create a single `index.html` with all CSS/JS inlined:

1. Use a build tool like `inline-source` or manually inline:
    - Copy CSS content into `<style>` tags
    - Copy JS content into `<script>` tags
2. Update CDN links to use full URLs
3. Test thoroughly

## Performance Optimization

### Reducing Bundle Size

-   Minify CSS/JS files
-   Use CDN versions of libraries
-   Lazy load non-critical components

### Improving Speed

-   Use Web Workers for PDF processing
-   Implement request caching
-   Optimize chunking algorithm
-   Use streaming responses if API supports

### Memory Management

-   Clear processed chunks after reconciliation
-   Limit log entries (currently 100)
-   Provide "Clear Storage" option

## Security Considerations

1. **API Keys:** Stored in localStorage (client-side only)
2. **XSS Prevention:** Sanitize user inputs
3. **HTTPS:** Always use HTTPS in production
4. **CSP:** Consider adding Content Security Policy headers
5. **API Key Exposure:** Never log API keys to console

## Browser Compatibility

**Minimum Requirements:**

-   ES6+ support
-   IndexedDB
-   Fetch API
-   localStorage
-   Web Speech API (for TTS)

**Tested Browsers:**

-   Chrome 90+
-   Firefox 88+
-   Safari 14+
-   Edge 90+

## Troubleshooting

### Common Issues

**"API key not configured"**

-   Check Settings → API Configuration
-   Ensure key is valid and has Gemini API enabled

**"Request timeout"**

-   Increase API Timeout in Settings
-   Check network connection

**"Rate limit exceeded"**

-   Wait for rate limit to reset
-   Use backup API key
-   Reduce parallel chunks

**PDF extraction fails**

-   Ensure PDF has selectable text (not scanned image)
-   Try a different PDF

**Browser crashes with large PDFs**

-   Reduce batch size
-   Disable Turbo Mode
-   Process smaller PDFs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Open a Pull Request

### Code Style

-   Use meaningful variable names
-   Add comments for complex logic
-   Follow existing code structure
-   Test in multiple browsers

## License

MIT License - See LICENSE file for details
