/**
 * Initialization Script
 * Loads first to set up error handling and check browser compatibility
 */

// Global error handler
window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error || event.message);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
});

// Check browser compatibility on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('[Init] DOM Content Loaded');

    // Check for required features
    const required = {
        indexedDB: 'indexedDB' in window,
        fetch: 'fetch' in window,
        promises: 'Promise' in window,
        localStorage: 'localStorage' in window
    };

    const missing = Object.entries(required)
        .filter(([key, supported]) => !supported)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error('[Init] Missing browser features:', missing);
        alert(`Your browser is missing required features: ${missing.join(', ')}\n\nPlease use a modern browser like Chrome, Firefox, or Edge.`);
    } else {
        console.log('[Init] All required browser features available');
    }
});

console.log('[Init] Initialization script loaded');
