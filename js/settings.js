/**
 * Settings Management
 * Handles application settings with localStorage persistence
 */

const DEFAULT_SETTINGS = {
    // API Configuration
    apiKey: '',
    backupApiKey: '',
    primaryModel: 'gemini-1.5-flash',
    fallbackModels: ['gemini-1.5-pro', 'gemini-1.5-flash-8b'],

    // Processing Settings
    batchSize: 8000,
    overlapSize: 200,
    maxRetries: 3,
    retryDelay: 1000,
    apiTimeout: 60,
    rateLimitDelay: 500,
    turboMode: false,
    parallelChunks: 3,
    multimodalEnabled: false,
    autoRetry: true,

    // Model Parameters
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,

    // Transformation Rules
    preserveFormatting: true,
    expandAcronyms: true,
    removeCitations: true,
    verbosity: 'balanced',
    tone: 'conversational',

    // PDF Output
    pdfFont: 'helvetica',
    pdfFontSize: 12,
    pdfLineHeight: 1.5,
    pdfMargin: 40,
    pdfPageSize: 'letter',
    pdfPageNumbers: true,
    pdfToc: false,
    ssmlOutput: false,
    insertPauses: false,

    // UI Settings
    theme: 'light',
    advancedLogs: false,
    onboardingCompleted: false,

    // Prompts
    prompts: {
        system: `You are an expert at converting technical documents into natural, spoken language optimized for text-to-speech applications. Your goal is to transform written content into a form that sounds natural when read aloud.`,

        text: `Transform the following text into natural, spoken language. Follow these rules:
1. Preserve the original language
2. Convert technical jargon into plain language where appropriate
3. Expand acronyms on first use
4. Remove inline citations but preserve meaning
5. Make the text flow naturally when read aloud
6. Keep the tone ${DEFAULT_SETTINGS.tone} and verbosity ${DEFAULT_SETTINGS.verbosity}

Text to transform:
{text}`,

        code: `Describe the following code in natural language. Explain what it does, its purpose, and key logic without reading it line-by-line. Make it understandable to someone listening:

{code}`,

        table: `Convert the following table into a narrative description. Explain what the table shows, describe key patterns or trends, and make the data understandable when spoken aloud:

{table}`,

        figure: `Describe this figure/image in detail for someone who cannot see it. Explain what it shows, any labels, axes, trends, or important visual elements:

{figure}`,

        math: `Convert the following mathematical notation into spoken form. Say it as you would speak it naturally:

{math}`
    }
};

class Settings {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.listeners = [];
        this.load();
    }

    // Load settings from localStorage
    load() {
        try {
            const stored = localStorage.getItem('spokablePdfSettings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...DEFAULT_SETTINGS, ...parsed };

                // Deep merge prompts
                if (parsed.prompts) {
                    this.settings { ...DEFAULT_SETTINGS.prompts, ...parsed.prompts };
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }

        // Apply theme
        this.applyTheme();
    }

    // Save settings to localStorage
    save() {
        try {
            localStorage.setItem('spokablePdfSettings', JSON.stringify(this.settings));
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    // Get a setting value
    get(key) {
        return this.settings[key];
    }

    // Set a setting value
    set(key, value) {
        this.settings[key] = value;
        this.save();

        // Apply theme if changed
        if (key === 'theme') {
            this.applyTheme();
        }
    }

    // Get all settings
    getAll() {
        return { ...this.settings };
    }

    // Update multiple settings
    update(updates) {
        this.settings = { ...this.settings, ...updates };
        this.save();

        if (updates.theme) {
            this.applyTheme();
        }
    }

    // Reset to defaults
    reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.save();
        this.applyTheme();
    }

    // Reset only prompts
    resetPrompts() {
        this.settings.prompts = { ...DEFAULT_SETTINGS.prompts };
        this.save();
    }

    // Apply theme to document
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    // Toggle theme
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.save();
        this.applyTheme();
    }

    // Clear API keys
    clearApiKeys() {
        this.settings.apiKey = '';
        this.settings.backupApiKey = '';
        this.save();
    }

    // Validate settings
    validate() {
        const errors = [];

        if (!this.settings.apiKey) {
            errors.push('API key is required');
        }

        if (this.settings.batchSize < 1000 || this.settings.batchSize > 100000) {
            errors.push('Batch size must be between 1000 and 100000');
        }

        if (this.settings.overlapSize < 0 || this.settings.overlapSize > 2000) {
            errors.push('Overlap size must be between 0 and 2000');
        }

        if (this.settings.temperature < 0 || this.settings.temperature > 2) {
            errors.push('Temperature must be between 0 and 2');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Get prompt with variables replaced
    getPrompt(type, variables = {}) {
        let prompt = this.settings.prompts[type] || '';

        // Replace variables
        Object.entries(variables).forEach(([key, value]) => {
            prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        // Replace settings placeholders
        prompt = prompt.replace(/\{tone\}/g, this.settings.tone);
        prompt = prompt.replace(/\{verbosity\}/g, this.settings.verbosity);

        return prompt;
    }

    // Add change listener
    onChange(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.settings));
    }

    // Export settings as JSON
    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    // Import settings from JSON
    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = { ...DEFAULT_SETTINGS, ...imported };
            this.save();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

// Create singleton instance
const settings = new Settings();

// Initialize settings UI when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initSettingsUI();
    });
}

function initSettingsUI() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            settings.toggleTheme();
            updateThemeIcon();
        });
        updateThemeIcon();
    }

    // Settings modal
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeButtons = settingsModal?.querySelectorAll('.modal-close');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
            loadSettingsToUI();
        });

        closeButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                settingsModal.style.display = 'none';
            });
        });

        // Close on outside click
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Auto-save on input change
    setupAutoSave();

    // Special buttons
    document.getElementById('clear-api-keys')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all API keys?')) {
            settings.clearApiKeys();
            loadSettingsToUI();
        }
    });

    document.getElementById('reset-prompts')?.addEventListener('click', () => {
        if (confirm('Reset all prompts to defaults?')) {
            settings.resetPrompts();
            loadSettingsToUI();
        }
    });

    document.getElementById('clear-storage')?.addEventListener('click', async () => {
        if (confirm('This will delete all stored PDFs, results, and logs. Continue?')) {
            await db.clearAll();
            alert('Storage cleared successfully');
        }
    });

    document.getElementById('export-logs')?.addEventListener('click', async () => {
        const logs = await db.getLogs(1000);
        const logText = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        downloadFile(blob, `spokable-pdf-logs-${Date.now()}.txt`);
    });

    document.getElementById('toggle-api-key')?.addEventListener('click', (e) => {
        const input = document.getElementById('api-key');
        if (input.type === 'password') {
            input.type = 'text';
            e.target.textContent = 'Hide';
        } else {
            input.type = 'password';
            e.target.textContent = 'Show';
        }
    });
}

function updateThemeIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = settings.get('theme') === 'light' ? '🌙' : '☀️';
    }
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

function loadSettingsToUI() {
    const allSettings = settings.getAll();

    // API settings
    document.getElementById('api-key').value = allSettings.apiKey;
    document.getElementById('backup-api-key').value = allSettings.backupApiKey;
    document.getElementById('primary-model').value = allSettings.primaryModel;

    // Processing settings
    document.getElementById('batch-size').value = allSettings.batchSize;
    document.getElementById('overlap-size').value = allSettings.overlapSize;
    document.getElementById('max-retries').value = allSettings.maxRetries;
    document.getElementById('retry-delay').value = allSettings.retryDelay;
    document.getElementById('api-timeout').value = allSettings.apiTimeout;
    document.getElementById('rate-limit-delay').value = allSettings.rateLimitDelay;
    document.getElementById('turbo-mode').checked = allSettings.turboMode;
    document.getElementById('parallel-chunks').value = allSettings.parallelChunks;
    document.getElementById('multimodal-enabled').checked = allSettings.multimodalEnabled;
    document.getElementById('auto-retry').checked = allSettings.autoRetry;

    // Prompts
    document.getElementById('system-prompt').value = allSettings.prompts.system;
    document.getElementById('text-prompt').value = allSettings.prompts.text;
    document.getElementById('code-prompt').value = allSettings.prompts.code;
    document.getElementById('table-prompt').value = allSettings.prompts.table;
    document.getElementById('figure-prompt').value = allSettings.prompts.figure;
    document.getElementById('math-prompt').value = allSettings.prompts.math;

    // PDF settings
    document.getElementById('pdf-font').value = allSettings.pdfFont;
    document.getElementById('pdf-font-size').value = allSettings.pdfFontSize;
    document.getElementById('pdf-line-height').value = allSettings.pdfLineHeight;
    document.getElementById('pdf-margin').value = allSettings.pdfMargin;
    document.getElementById('pdf-page-size').value = allSettings.pdfPageSize;
    document.getElementById('pdf-page-numbers').checked = allSettings.pdfPageNumbers;
    document.getElementById('pdf-toc').checked = allSettings.pdfToc;
    document.getElementById('ssml-output').checked = allSettings.ssmlOutput;
    document.getElementById('insert-pauses').checked = allSettings.insertPauses;

    // Advanced settings
    document.getElementById('temperature').value = allSettings.temperature;
    document.getElementById('top-p').value = allSettings.topP;
    document.getElementById('top-k').value = allSettings.topK;
    document.getElementById('max-output-tokens').value = allSettings.maxOutputTokens;
    document.getElementById('preserve-formatting').checked = allSettings.preserveFormatting;
    document.getElementById('expand-acronyms').checked = allSettings.expandAcronyms;
    document.getElementById('remove-citations').checked = allSettings.removeCitations;
    document.getElementById('verbosity').value = allSettings.verbosity;
    document.getElementById('tone').value = allSettings.tone;
    document.getElementById('advanced-logs').checked = allSettings.advancedLogs;
}

function setupAutoSave() {
    const inputs = document.querySelectorAll('#settings-modal input, #settings-modal select, #settings-modal textarea');

    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveSettingsFromUI();
        });
    });
}

function saveSettingsFromUI() {
    const updates = {
        // API
        apiKey: document.getElementById('api-key').value,
        backupApiKey: document.getElementById('backup-api-key').value,
        primaryModel: document.getElementById('primary-model').value,

        // Processing
        batchSize: parseInt(document.getElementById('batch-size').value),
        overlapSize: parseInt(document.getElementById('overlap-size').value),
        maxRetries: parseInt(document.getElementById('max-retries').value),
        retryDelay: parseInt(document.getElementById('retry-delay').value),
        apiTimeout: parseInt(document.getElementById('api-timeout').value),
        rateLimitDelay: parseInt(document.getElementById('rate-limit-delay').value),
        turboMode: document.getElementById('turbo-mode').checked,
        parallelChunks: parseInt(document.getElementById('parallel-chunks').value),
        multimodalEnabled: document.getElementById('multimodal-enabled').checked,
        autoRetry: document.getElementById('auto-retry').checked,

        // Prompts
        prompts: {
            system: document.getElementById('system-prompt').value,
            text: document.getElementById('text-prompt').value,
            code: document.getElementById('code-prompt').value,
            table: document.getElementById('table-prompt').value,
            figure: document.getElementById('figure-prompt').value,
            math: document.getElementById('math-prompt').value
        },

        // PDF
        pdfFont: document.getElementById('pdf-font').value,
        pdfFontSize: parseInt(document.getElementById('pdf-font-size').value),
        pdfLineHeight: parseFloat(document.getElementById('pdf-line-height').value),
        pdfMargin: parseInt(document.getElementById('pdf-margin').value),
        pdfPageSize: document.getElementById('pdf-page-size').value,
        pdfPageNumbers: document.getElementById('pdf-page-numbers').checked,
        pdfToc: document.getElementById('pdf-toc').checked,
        ssmlOutput: document.getElementById('ssml-output').checked,
        insertPauses: document.getElementById('insert-pauses').checked,

        // Advanced
        temperature: parseFloat(document.getElementById('temperature').value),
        topP: parseFloat(document.getElementById('top-p').value),
        topK: parseInt(document.getElementById('top-k').value),
        maxOutputTokens: parseInt(document.getElementById('max-output-tokens').value),
        preserveFormatting: document.getElementById('preserve-formatting').checked,
        expandAcronyms: document.getElementById('expand-acronyms').checked,
        removeCitations: document.getElementById('remove-citations').checked,
        verbosity: document.getElementById('verbosity').value,
        tone: document.getElementById('tone').value,
        advancedLogs: document.getElementById('advanced-logs').checked
    };

    settings.update(updates);
}
