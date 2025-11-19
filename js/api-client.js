/**
 * Gemini API Client
 * Handles REST API calls to Google AI Studio / Gemini API
 */

const AVAILABLE_MODELS = [
    {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        description: 'Fast, multimodal, experimental',
        contextWindow: 1000000,
        maxOutput: 8192
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Best reasoning and complex tasks',
        contextWindow: 2000000,
        maxOutput: 8192
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Balanced speed and quality',
        contextWindow: 1000000,
        maxOutput: 8192
    },
    {
        id: 'gemini-1.5-flash-8b',
        name: 'Gemini 1.5 Flash-8B',
        description: 'Fastest, most efficient',
        contextWindow: 1000000,
        maxOutput: 8192
    }
];

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

class GeminiAPIClient {
    constructor() {
        this.settings = settings;
        this.abortControllers = new Map();
    }

    // Call Gemini API with text
    async generateContent(prompt, modelId = null, options = {}) {
        const apiKey = this.settings.get('apiKey');
        if (!apiKey) {
            throw new Error('API key not configured. Please add your key in Settings.');
        }

        modelId = modelId || this.settings.get('primaryModel');
        const timeout = (options.timeout || this.settings.get('apiTimeout')) * 1000;

        // Create abort controller for this request
        const abortController = new AbortController();
        const requestId = generateId();
        this.abortControllers.set(requestId, abortController);

        // Set timeout
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, timeout);

        try {
            const url = `${API_BASE_URL}/${modelId}:generateContent`;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: this.settings.get('temperature'),
                    topP: this.settings.get('topP'),
                    topK: this.settings.get('topK'),
                    maxOutputTokens: this.settings.get('maxOutputTokens')
                }
            };

            if (this.settings.get('advancedLogs')) {
                console.log(`[API] Request to ${modelId}: ${JSON.stringify(requestBody).substring(0, 200)}...`);
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(requestBody),
                signal: abortController.signal
            });

            clearTimeout(timeoutId);
            this.abortControllers.delete(requestId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (this.settings.get('advancedLogs')) {
                console.log(`[API] Response: ${JSON.stringify(data).substring(0, 200)}...`);
            }

            // Extract text from response
            const text = this.extractTextFromResponse(data);

            return {
                text,
                model: modelId,
                usage: data.usageMetadata || {},
                raw: data
            };

        } catch (error) {
            clearTimeout(timeoutId);
            this.abortControllers.delete(requestId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            throw error;
        }
    }

    // Call with multimodal content (text + images)
    async generateMultimodalContent(textPrompt, imageData, modelId = null) {
        const apiKey = this.settings.get('apiKey');
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        modelId = modelId || this.settings.get('primaryModel');

        const url = `${API_BASE_URL}/${modelId}:generateContent`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: textPrompt },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: imageData // Base64 encoded
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: this.settings.get('temperature'),
                topP: this.settings.get('topP'),
                topK: this.settings.get('topK'),
                maxOutputTokens: this.settings.get('maxOutputTokens')
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            text: this.extractTextFromResponse(data),
            model: modelId,
            usage: data.usageMetadata || {}
        };
    }

    // Extract text from API response
    extractTextFromResponse(response) {
        try {
            if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts) {
                    return candidate.content.parts
                        .map(part => part.text || '')
                        .join('');
                }
            }
            return '';
        } catch (error) {
            console.error('Error extracting text from response:', error);
            return '';
        }
    }

    // Cancel a specific request
    cancelRequest(requestId) {
        const controller = this.abortControllers.get(requestId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(requestId);
        }
    }

    // Cancel all requests
    cancelAllRequests() {
        this.abortControllers.forEach(controller => controller.abort());
        this.abortControllers.clear();
    }

    // Get available models
    getAvailableModels() {
        return AVAILABLE_MODELS;
    }

    // Check if model supports multimodal
    isMultimodalModel(modelId) {
        return modelId.includes('gemini-2.0') || modelId.includes('gemini-1.5');
    }

    // Parse error and extract retry-after if present
    parseError(error, response = null) {
        let retryAfter = null;

        if (response && response.headers) {
            const retryHeader = response.headers.get('Retry-After');
            if (retryHeader) {
                retryAfter = parseInt(retryHeader) * 1000; // Convert to ms
            }
        }

        return {
            message: parseErrorMessage(error),
            retryAfter,
            isRateLimit: error.message?.includes('429') || error.message?.includes('rate limit'),
            isServerError: error.message?.includes('500') || error.message?.includes('503'),
            isAuthError: error.message?.includes('401') || error.message?.includes('403')
        };
    }
}

// Create singleton instance
const geminiClient = new GeminiAPIClient();
