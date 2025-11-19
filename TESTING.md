# Testing Guide

## Quick Test

1. Open `test-simple.html` in your browser
2. Click the "Click Me" button
3. Check if the text updates - this verifies basic JavaScript functionality

## Full Application Test

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge)
2. Open Developer Tools (F12)
3. Check the Console tab for any errors

### Expected Console Output

You should see:

```
[Init] Initialization script loaded
[Init] DOM Content Loaded
[Init] All required browser features available
[DB] Database initialized successfully
[App] Spokable PDF application initialized
```

### If You See Errors

**"Failed to initialize database"**

-   Your browser may not support IndexedDB
-   Try a different browser
-   Check if you're in private/incognito mode (some browsers restrict IndexedDB)

**"Missing browser features"**

-   Your browser is too old
-   Update to the latest version

**Scripts not loading**

-   Check that all files are in the correct directories
-   Verify file paths are correct
-   Check browser console for 404 errors

## Testing Buttons

### Theme Toggle

1. Click the moon/sun icon in the top right
2. Page should switch between light and dark mode

### Settings Button

1. Upload a PDF file (or just click Settings without uploading)
2. Click "⚙️ Settings" button
3. Settings modal should open
4. Try switching between tabs
5. Enter an API key and verify it saves (reload page to confirm)

### File Upload

1. Drag a PDF file onto the drop zone OR click "Choose Files"
2. File should appear in the "Selected Files" list
3. "Convert to Spokable PDF" button should appear

## Testing Without API Key

Most buttons will work without an API key. The conversion will fail at the API call stage, but you can test:

-   File upload
-   Settings UI
-   Theme toggle
-   Modal interactions

## Testing With API Key

1. Get a free API key from https://aistudio.google.com/app/apikey
2. Enter it in Settings → API Configuration
3. Upload a small PDF (1-2 pages)
4. Click "Convert to Spokable PDF"
5. Watch the progress indicators
6. Download the result

## Browser Compatibility Testing

Test in:

-   ✅ Chrome 90+
-   ✅ Firefox 88+
-   ✅ Edge 90+
-   ✅ Safari 14+

## Common Issues

### Buttons Don't Work

-   Check browser console for JavaScript errors
-   Verify all script files loaded successfully
-   Try `test-simple.html` to isolate the issue

### Settings Don't Save

-   Check if localStorage is enabled
-   Not in private/incognito mode
-   Browser has storage quota available

### PDF Upload Fails

-   File must be a PDF
-   PDF must have selectable text (not scanned image)
-   Check file size (very large PDFs may cause issues)

## Performance Testing

### Small PDF (1-10 pages)

-   Should process in under 1 minute
-   Memory usage should stay under 200MB

### Medium PDF (10-50 pages)

-   May take 2-5 minutes
-   Memory usage 200-500MB

### Large PDF (50+ pages)

-   May take 10+ minutes
-   Consider using Turbo Mode
-   Watch for browser memory limits

## Debugging Tips

### Enable Advanced Logs

1. Open Settings → Advanced
2. Check "Enable advanced logging"
3. Check console for detailed API request/response logs

### Export Logs

1. Settings → Advanced → Export Logs
2. Download log file for debugging

### Clear Storage

If things get stuck:

1. Settings → Advanced → Clear All Storage
2. Reload the page
3. Start fresh

## Automated Testing (Future)

Currently manual testing only. Future improvements:

-   Unit tests for utility functions
-   Integration tests for API client
-   E2E tests with Playwright/Cypress
