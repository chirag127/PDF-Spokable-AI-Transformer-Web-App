/**
 * PDF Text Extractor
 * Extracts text from PDF files using PDF.js library
 * Note: This requires pdf.js library to be loaded
 */

class PDFExtractor {
    constructor() {
        this.pdfjsLib = null;
        this.initPDFJS();
    }

    async initPDFJS() {
        // Load PDF.js from CDN if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            await this.loadPDFJS();
        } else {
            this.pdfjsLib = pdfjsLib;
        }
    }

    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                this.pdfjsLib = window['pdfjs-dist/build/pdf'];
                this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async extractText(pdfData) {
        await this.initPDFJS();

        const loadingTask = this.pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        const numPages = pdf.numPages;
        const textPages = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Extract text items
            const pageText = textContent.items.map(item => item.str).join(' ');
            textPages.push({
                pageNumber: pageNum,
                text: pageText
            });
        }

        return {
            numPages,
            pages: textPages,
            fullText: textPages.map(p => p.text).join('\n\n')
        };
    }

    // Classify document elements (basic heuristics)
    classifyElements(text) {
        const lines = text.split('\n');
        const elements = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const element = {
                type: 'paragraph',
                content: line,
                lineNumber: i
            };

            // Detect headings (all caps, short, or ends with colon)
            if (line.length < 100 && (line === line.toUpperCase() || /^[A-Z][^.!?]*:$/.test(line))) {
                element.type = 'heading';
            }
            // Detect code (indented or contains common code patterns)
            else if (/^[\s]{4,}/.test(lines[i]) || /[{}();]/.test(line)) {
                element.type = 'code';
            }
            // Detect lists
            else if (/^[\s]*[-*•]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
                element.type = 'list';
            }
            // Detect URLs
            else if (/https?:\/\//.test(line)) {
                element.type = 'url';
            }
            // Detect math (contains common math symbols)
            else if (/[∑∫∂√π≈≠≤≥±×÷]/.test(line) || /\^|\d+\/\d+/.test(line)) {
                element.type = 'math';
            }
            // Detect tables (contains multiple tabs or pipes)
            else if (/\t{2,}/.test(line) || /\|.*\|.*\|/.test(line)) {
                element.type = 'table';
            }

            elements.push(element);
        }

        return elements;
    }

    // Extract images/figures metadata
    async extractImages(pdfData) {
        await this.initPDFJS();

        const loadingTask = this.pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        const images = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const ops = await page.getOperatorList();

            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] === this.pdfjsLib.OPS.paintImageXObject) {
                    images.push({
                        pageNumber: pageNum,
                        index: i,
                        name: ops.argsArray[i][0]
                    });
                }
            }
        }

        return images;
    }
}

// Create singleton instance
const pdfExtractor = new PDFExtractor();
