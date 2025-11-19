/**
 * Main Application Controller
 * Orchestrates the PDF conversion process
 */

class SpokablePDFApp {
    constructor() {
        this.currentProcessing = null;
        this.processedText = '';
        this.init();
    }

    init() {
        // Check browser support
        const support = checkBrowserSupport();
        if (!support.supported) {
            alert(`Your browser is missing required features: ${support.missing.join(', ')}`);
            return;
        }

        // Initialize event listeners
        document.getElementById('start-conversion')?.addEventListener('click', () => {
            this.startConversion();
        });

        document.getElementById('cancel-btn')?.addEventListener('click', () => {
            this.cancelConversion();
        });

        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('download-partial')?.addEventListener('click', () => {
            this.downloadPartial();
        });

        document.getElementById('download-result')?.addEventListener('click', () => {
            this.downloadResult();
        });

        document.getElementById('play-audio')?.addEventListener('click', () => {
            this.playAudio();
        });

        document.getElementById('convert-another')?.addEventListener('click', () => {
            this.reset();
        });
    }

    async startConversion() {
        // Validate settings
        const validation = settings.validate();
        if (!validation.valid) {
            uiController.showError(validation.errors.join('\n'));
            return;
        }

        // Get selected files
        const files = fileHandler.getSelectedFiles();
        if (files.length === 0) {
            uiController.showError('Please select at least one PDF file');
            return;
        }

        uiController.showProgress();
        uiController.clearLog();
        uiController.addLog('Starting conversion process...');

        try {
            for (const fileData of files) {
                await this.processFile(fileData);
            }

            uiController.showSuccess('Conversion completed successfully!');
            uiController.showResults();
        } catch (error) {
            console.error('Conversion error:', error);
            uiController.showError(error.message);
        }
    }

    async processFile(fileData) {
        const stages = {
            extract: 10,
            chunk: 20,
            transform: 80,
            generate: 95,
            complete: 100
        };

        try {
            // Stage 1: Extract text from PDF
            uiController.updateProgress('Extracting text from PDF...', 0, stages.extract);
            uiController.addLog(`Processing: ${fileData.name}`);

            const pdfData = await db.getPDF(fileData.id);
            const extracted = await pdfExtractor.extractText(pdfData.data);

            uiController.addLog(`Extracted ${extracted.numPages} pages, ${estimateTokens(extracted.fullText)} tokens`);

            // Stage 2: Chunk text
            uiController.updateProgress('Chunking text...', 0, stages.chunk);

            const chunks = textChunker.chunkText(extracted.fullText);
            uiController.addLog(`Created ${chunks.length} chunks`);

            // Stage 3: Transform chunks with AI
            uiController.updateProgress('Transforming text with AI...', 0, stages.transform);

            const processChunk = async (chunk, model) => {
                const prompt = settings.getPrompt('text', { text: chunk.text });
                const systemPrompt = settings.get('prompts').system;
                const fullPrompt = `${systemPrompt}\n\n${prompt}`;

                return await geminiClient.generateContent(fullPrompt, model);
            };

            const progressCallback = (completed, total, result) => {
                const percent = (completed / total) * 100;
                const overallPercent = stages.chunk + ((stages.transform - stages.chunk) * (completed / total));
                uiController.updateProgress(
                    `Processing chunk ${completed}/${total} (Model: ${result.model})`,
                    percent,
                    overallPercent
                );
                uiController.addLog(`Chunk ${completed}/${total} completed`);
            };

            let results;
            if (settings.get('turboMode')) {
                uiController.addLog('Using Turbo Mode (parallel processing)');
                results = await retryManager.processChunksParallel(chunks, processChunk, progressCallback);
            } else {
                results = await retryManager.processChunksSequential(chunks, processChunk, progressCallback);
            }

            // Check for failures
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                uiController.showWarning(`${failures.length} chunks failed to process`);
            }

            // Stage 4: Reconcile and generate PDF
            uiController.updateProgress('Generating output PDF...', 0, stages.generate);

            const successfulResults = results.filter(r => r.success);
            this.processedText = textChunker.reconcileChunks(successfulResults);

            // Apply SSML/pause insertion if enabled
            if (settings.get('ssmlOutput')) {
                this.processedText = this.insertSSML(this.processedText);
            } else if (settings.get('insertPauses')) {
                this.processedText = this.insertPauses(this.processedText);
            }

            uiController.addLog(`Final text: ${estimateTokens(this.processedText)} tokens`);

            // Save result to database
            await db.saveResult(fileData.id, {
                originalFilename: fileData.name,
                transformedText: this.processedText,
                chunks: results.length,
                successfulChunks: successfulResults.length
            });

            uiController.updateProgress('Complete!', 100, stages.complete);

        } catch (error) {
            throw new Error(`Failed to process ${fileData.name}: ${error.message}`);
        }
    }

    insertSSML(text) {
        // Insert basic SSML markers
        return text
            .replace(/\n\n/g, '<break time="1s"/>\n\n')
            .replace(/([.!?])\s/g, '$1<break time="500ms"/> ');
    }

    insertPauses(text) {
        // Insert natural pauses
        return text
            .replace(/\n\n/g, '... \n\n')
            .replace(/([.!?])\s/g, '$1 ... ');
    }

    async downloadResult() {
        if (!this.processedText) {
            uiController.showError('No processed text available');
            return;
        }

        try {
            uiController.addLog('Generating PDF...');
            const pdfBlob = await pdfGenerator.generatePDF(this.processedText);
            const filename = `spokable-${Date.now()}.pdf`;
            pdfGenerator.downloadPDF(pdfBlob, filename);
            uiController.showSuccess('PDF downloaded successfully!');
        } catch (error) {
            console.error('PDF generation error:', error);
            uiController.showError('Failed to generate PDF: ' + error.message);
        }
    }

    async downloadPartial() {
        if (!this.processedText) {
            uiController.showError('No processed text available yet');
            return;
        }

        try {
            const pdfBlob = await pdfGenerator.generatePDF(this.processedText);
            const filename = `spokable-partial-${Date.now()}.pdf`;
            pdfGenerator.downloadPDF(pdfBlob, filename);
            uiController.showSuccess('Partial PDF downloaded');
        } catch (error) {
            uiController.showError('Failed to generate partial PDF');
        }
    }

    playAudio() {
        if (!this.processedText) {
            uiController.showError('No processed text available');
            return;
        }

        const audioPlayer = document.getElementById('audio-player');
        if (audioPlayer) {
            audioPlayer.style.display = 'block';
            ttsPlayer.loadText(this.processedText);
            ttsPlayer.play();
        }
    }

    cancelConversion() {
        if (confirm('Cancel the current conversion?')) {
            geminiClient.cancelAllRequests();
            uiController.addLog('Conversion cancelled by user', 'warning');
            uiController.hideProgress();
            document.getElementById('conversion-controls').style.display = 'flex';
        }
    }

    togglePause() {
        uiController.setPaused(!uiController.isPaused);
        if (uiController.isPaused) {
            uiController.addLog('Conversion paused', 'warning');
        } else {
            uiController.addLog('Conversion resumed');
        }
    }

    reset() {
        this.processedText = '';
        uiController.hideProgress();
        uiController.resultsSection.style.display = 'none';
        document.getElementById('conversion-controls').style.display = 'flex';
        document.getElementById('audio-player').style.display = 'none';
    }
}

// Initialize app when DOM is ready
let app;
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        app = new SpokablePDFApp();
        console.log('[App] Spokable PDF application initialized');
    });
}
