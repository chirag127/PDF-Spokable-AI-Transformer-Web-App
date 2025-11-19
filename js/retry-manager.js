/**
 * Retry Manager
 * Handles retry logic, failover, and rate limiting
 */

class RetryManager {
    constructor() {
        this.settings = settings;
    }

    async executeWithRetry(fn, chunkIndex = 0) {
        const maxRetries = this.settings.get('maxRetries');
        const retryDelay = this.settings.get('retryDelay');
        const models = [this.settings.get('primaryModel'), ...this.settings.get('fallbackModels')];

        let lastError = null;

        for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
            const model = models[modelIndex];

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`[Retry] Chunk ${chunkIndex}: Attempt ${attempt + 1} with ${model}`);
                    const result = await fn(model);
                    return result;
                } catch (error) {
                    lastError = error;
                    const errorInfo = geminiClient.parseError(error);

                    console.warn(`[Retry] Chunk ${chunkIndex}: Error - ${errorInfo.message}`);

                    // If auth error, don't retry
                    if (errorInfo.isAuthError) {
                        throw new Error('Authentication failed. Please check your API key.');
                    }

                    // If last attempt with this model, try next model
                    if (attempt === maxRetries) {
                        console.warn(`[Retry] Chunk ${chunkIndex}: Max retries reached for ${model}`);
                        break;
                    }

                    // Calculate delay
                    let delay = retryDelay * Math.pow(2, attempt);
                    if (errorInfo.retryAfter) {
                        delay = errorInfo.retryAfter;
                    }

                    console.log(`[Retry] Chunk ${chunkIndex}: Retrying in ${delay}ms...`);
                    await sleep(delay);
                }
            }
        }

        throw new Error(`All retry attempts failed: ${lastError?.message || 'Unknown error'}`);
    }

    async processChunksSequential(chunks, processFn, progressCallback) {
        const results = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            try {
                const result = await this.executeWithRetry(
                    (model) => processFn(chunk, model),
                    i
                );

                results.push({
                    index: i,
                    chunk,
                    result: result.text,
                    model: result.model,
                    success: true
                });

                if (progressCallback) {
                    progressCallback(i + 1, chunks.length, result);
                }

                // Rate limiting delay
                if (i < chunks.length - 1) {
                    await sleep(this.settings.get('rateLimitDelay'));
                }
            } catch (error) {
                console.error(`[Retry] Chunk ${i} failed: ${error.message}`);
                results.push({
                    index: i,
                    chunk,
                    error: error.message,
                    success: false
                });

                if (!this.settings.get('autoRetry')) {
                    throw error;
                }
            }
        }

        return results;
    }

    async processChunksParallel(chunks, processFn, progressCallback) {
        const parallelLimit = this.settings.get('parallelChunks');
        const results = new Array(chunks.length);
        let completed = 0;

        const processChunk = async (chunk, index) => {
            try {
                const result = await this.executeWithRetry(
                    (model) => processFn(chunk, model),
                    index
                );

                results[index] = {
                    index,
                    chunk,
                    result: result.text,
                    model: result.model,
                    success: true
                };

                completed++;
                if (progressCallback) {
                    progressCallback(completed, chunks.length, result);
                }
            } catch (error) {
                console.error(`[Retry] Chunk ${index} failed: ${error.message}`);
                results[index] = {
                    index,
                    chunk,
                    error: error.message,
                    success: false
                };
                completed++;
            }
        };

        // Process in batches
        for (let i = 0; i < chunks.length; i += parallelLimit) {
            const batch = chunks.slice(i, i + parallelLimit);
            const promises = batch.map((chunk, batchIndex) =>
                processChunk(chunk, i + batchIndex)
            );
            await Promise.all(promises);

            // Rate limiting between batches
            if (i + parallelLimit < chunks.length) {
                await sleep(this.settings.get('rateLimitDelay'));
            }
        }

        return results;
    }
}

const retryManager = new RetryManager();
