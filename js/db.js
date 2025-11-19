/**
 * IndexedDB Wrapper
 * Handles persistent storage for PDFs, settings, and processing state
 */

const DB_NAME = 'SpokablePDFDB';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store for uploaded PDFs
                if (!db.objectStoreNames.contains('pdfs')) {
                    const pdfStore = db.createObjectStore('pdfs', { keyPath: 'id' });
                    pdfStore.createIndex('filename', 'filename', { unique: false });
                    pdfStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                }

                // Store for processing state
                if (!db.objectStoreNames.contains('processing')) {
                    db.createObjectStore('processing', { keyPath: 'id' });
                }

                // Store for results
                if (!db.objectStoreNames.contains('results')) {
                    const resultStore = db.createObjectStore('results', { keyPath: 'id' });
                    resultStore.createIndex('pdfId', 'pdfId', { unique: false });
                    resultStore.createIndex('completedDate', 'completedDate', { unique: false });
                }

                // Store for logs
                if (!db.objectStoreNames.contains('logs')) {
                    const logStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                    logStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // Generic get operation
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic put operation
    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic delete operation
    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get all items from store
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Clear entire store
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // PDF-specific methods
    async savePDF(file, metadata = {}) {
        const id = generateId();
        const arrayBuffer = await file.arrayBuffer();

        const pdfData = {
            id,
            filename: file.name,
            size: file.size,
            type: file.type,
            data: arrayBuffer,
            uploadDate: new Date().toISOString(),
            ...metadata
        };

        await this.put('pdfs', pdfData);
        return id;
    }

    async getPDF(id) {
        return await this.get('pdfs', id);
    }

    async getAllPDFs() {
        return await this.getAll('pdfs');
    }

    async deletePDF(id) {
        await this.delete('pdfs', id);
        // Also delete associated processing state and results
        await this.delete('processing', id);
        const results = await this.getAll('results');
        for (const result of results) {
            if (result.pdfId === id) {
                await this.delete('results', result.id);
            }
        }
    }

    // Processing state methods
    async saveProcessingState(id, state) {
        await this.put('processing', { id, ...state, lastUpdated: new Date().toISOString() });
    }

    async getProcessingState(id) {
        return await this.get('processing', id);
    }

    async deleteProcessingState(id) {
        await this.delete('processing', id);
    }

    // Result methods
    async saveResult(pdfId, result) {
        const id = generateId();
        const resultData = {
            id,
            pdfId,
            ...result,
            completedDate: new Date().toISOString()
        };
        await this.put('results', resultData);
        return id;
    }

    async getResult(id) {
        return await this.get('results', id);
    }

    async getResultsByPDFId(pdfId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['results'], 'readonly');
            const store = transaction.objectStore('results');
            const index = store.index('pdfId');
            const request = index.getAll(pdfId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Log methods
    async addLog(message, level = 'info', metadata = {}) {
        const logEntry = {
            message,
            level,
            timestamp: new Date().toISOString(),
            ...metadata
        };
        await this.put('logs', logEntry);
    }

    async getLogs(limit = 100) {
        const logs = await this.getAll('logs');
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
    }

    async clearLogs() {
        await this.clear('logs');
    }

    // Clear all data
    async clearAll() {
        await this.clear('pdfs');
        await this.clear('processing');
        await this.clear('results');
        await this.clear('logs');
    }
}

// Create singleton instance
const db = new Database();

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await db.init();
            console.log('[DB] Database initialized successfully');
        } catch (error) {
            console.error('[DB] Failed to initialize database:', error);
        }
    });
}
