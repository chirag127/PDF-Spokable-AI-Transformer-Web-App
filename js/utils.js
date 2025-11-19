/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

// Format bytes to human-readable size
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sleep/delay function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Format date/time
function formatDateTime(date) {
    return new Date(date).toLocaleString();
}

// Sanitize filename
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9.-]/gi, '_');
}

// Download file helper
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

// Parse error message
function parseErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error && error.error.message) return error.error.message;
    return 'An unknown error occurred';
}

// Validate API key format (basic check)
function isValidApiKey(key) {
    return key && key.length > 20 && /^[A-Za-z0-9_-]+$/.test(key);
}

// Chunk array into smaller arrays
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = baseDelay * Math.pow(2, i);
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
            await sleep(delay);
        }
    }
}

// Check if browser supports required features
function checkBrowserSupport() {
    const required = {
        indexedDB: 'indexedDB' in window,
        fetch: 'fetch' in window,
        promises: 'Promise' in window,
        localStorage: 'localStorage' in window,
        webWorker: 'Worker' in window
    };

    const missing = Object.entries(required)
        .filter(([key, supported]) => !supported)
        .map(([key]) => key);

    return {
        supported: missing.length === 0,
        missing
    };
}

// Log to console with timestamp
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
        case 'error':
            console.error(prefix, message);
            break;
        case 'warn':
            console.warn(prefix, message);
            break;
        default:
            console.log(prefix, message);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatBytes,
        estimateTokens,
        generateId,
        debounce,
        sleep,
        formatDateTime,
        sanitizeFilename,
        downloadFile,
        copyToClipboard,
        parseErrorMessage,
        isValidApiKey,
        chunkArray,
        retryWithBackoff,
        checkBrowserSupport,
        log
    };
}
