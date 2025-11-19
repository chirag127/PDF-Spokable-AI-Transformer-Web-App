/**
 * Text Chunking
 * Splits text into manageable chunks with overlap for API processing
 */

class TextChunker {
    constructor() {
        this.settings = settings;
    }

    // Split text into chunks based on token limits
    chunkText(text, batchSize = null, overlapSize = null) {
        batchSize = batchSize || this.settings.get('batchSize');
        overlapSize = overlapSize || this.settings.get('overlapSize');

        // Split into sentences first
        const sentences = this.splitIntoSentences(text);
        const chunks = [];
        let currentChunk = [];
        let currentTokens = 0;

        for (const sentence of sentences) {
            const sentenceTokens = estimateTokens(sentence);

            // If single sentence exceeds batch size, split it further
            if (sentenceTokens > batchSize) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.join(' '));
                    currentChunk = [];
                    currentTokens = 0;
                }

                // Split long sentence by words
                const words = sentence.split(/\s+/);
                let wordChunk = [];
                let wordTokens = 0;

                for (const word of words) {
                    const wordToken = estimateTokens(word);
                    if (wordTokens + wordToken > batchSize && wordChunk.length > 0) {
                        chunks.push(wordChunk.join(' '));
                        wordChunk = [];
                        wordTokens = 0;
                    }
                    wordChunk.push(word);
                    wordTokens += wordToken;
                }

                if (wordChunk.length > 0) {
                    chunks.push(wordChunk.join(' '));
                }
                continue;
            }

            // Add sentence to current chunk
            if (currentTokens + sentenceTokens > batchSize && currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));

                // Add overlap from previous chunk
                const overlapSentences = this.getOverlapSentences(currentChunk, overlapSize);
                currentChunk = overlapSentences;
                currentTokens = estimateTokens(currentChunk.join(' '));
            }

            currentChunk.push(sentence);
            currentTokens += sentenceTokens;
        }

        // Add remaining chunk
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
        }

        return chunks.map((chunk, index) => ({
            index,
            text: chunk,
            tokens: estimateTokens(chunk),
            hasOverlap: index > 0
        }));
    }

    // Split text into sentences
    splitIntoSentences(text) {
        // Simple sentence splitting (can be improved with NLP library)
        return text
            .replace(/([.!?])\s+/g, '$1|')
            .split('|')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    // Get sentences for overlap
    getOverlapSentences(sentences, overlapSize) {
        const overlap = [];
        let tokens = 0;

        for (let i = sentences.length - 1; i >= 0; i--) {
            const sentenceTokens = estimateTokens(sentences[i]);
            if (tokens + sentenceTokens > overlapSize) break;
            overlap.unshift(sentences[i]);
            tokens += sentenceTokens;
        }

        return overlap;
    }

    // Reconcile overlapping chunks to remove duplicates
    reconcileChunks(processedChunks) {
        if (processedChunks.length === 0) return '';
        if (processedChunks.length === 1) return processedChunks[0].result;

        const reconciled = [processedChunks[0].result];

        for (let i = 1; i < processedChunks.length; i++) {
            const current = processedChunks[i].result;
            const previous = reconciled[reconciled.length - 1];

            // Find overlap by comparing end of previous with start of current
            const overlapText = this.findOverlap(previous, current);

            if (overlapText) {
                // Remove overlap from current chunk
                const withoutOverlap = current.substring(overlapText.length).trim();
                reconciled.push(withoutOverlap);
            } else {
                reconciled.push(current);
            }
        }

        return reconciled.join('\n\n');
    }

    // Find overlapping text between two strings
    findOverlap(str1, str2, minLength = 50) {
        const end = str1.substring(str1.length - 500); // Check last 500 chars
        const start = str2.substring(0, 500); // Check first 500 chars

        let maxOverlap = '';

        for (let i = minLength; i <= Math.min(end.length, start.length); i++) {
            const endSubstr = end.substring(end.length - i);
            const startSubstr = start.substring(0, i);

            if (endSubstr === startSubstr && i > maxOverlap.length) {
                maxOverlap = endSubstr;
            }
        }

        return maxOverlap;
    }

    // Chunk by document structure (preserve sections)
    chunkByStructure(elements, batchSize = null) {
        batchSize = batchSize || this.settings.get('batchSize');

        const chunks = [];
        let currentChunk = [];
        let currentTokens = 0;

        for (const element of elements) {
            const elementTokens = estimateTokens(element.content);

            // Start new chunk at headings if current chunk is large enough
            if (element.type === 'heading' && currentTokens > batchSize * 0.5) {
                if (currentChunk.length > 0) {
                    chunks.push({
                        elements: currentChunk,
                        tokens: currentTokens
                    });
                    currentChunk = [];
                    currentTokens = 0;
                }
            }

            // If adding element exceeds batch size, start new chunk
            if (currentTokens + elementTokens > batchSize && currentChunk.length > 0) {
                chunks.push({
                    elements: currentChunk,
                    tokens: currentTokens
                });
                currentChunk = [];
                currentTokens = 0;
            }

            currentChunk.push(element);
            currentTokens += elementTokens;
        }

        // Add remaining chunk
        if (currentChunk.length > 0) {
            chunks.push({
                elements: currentChunk,
                tokens: currentTokens
            });
        }

        return chunks;
    }
}

// Create singleton instance
const textChunker = new TextChunker();
