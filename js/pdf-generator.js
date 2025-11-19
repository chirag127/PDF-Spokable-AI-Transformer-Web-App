/**
 * PDF Generator
 * Creates output PDF from transformed text using jsPDF
 */

class PDFGenerator {
    constructor() {
        this.jsPDF = null;
        this.initJsPDF();
    }

    async initJsPDF() {
        if (typeof jspdf === 'undefined') {
            await this.loadJsPDF();
        } else {
            this.jsPDF = jspdf.jsPDF;
        }
    }

    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                this.jsPDF = window.jspdf.jsPDF;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async generatePDF(text, filename = 'spokable-output.pdf') {
        await this.initJsPDF();

        const pdfSettings = {
            font: settings.get('pdfFont'),
            fontSize: settings.get('pdfFontSize'),
            lineHeight: settings.get('pdfLineHeight'),
            margin: settings.get('pdfMargin'),
            pageSize: settings.get('pdfPageSize'),
            pageNumbers: settings.get('pdfPageNumbers')
        };

        const doc = new this.jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: pdfSettings.pageSize
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = pdfSettings.margin;
        const maxWidth = pageWidth - (margin * 2);

        doc.setFont(pdfSettings.font);
        doc.setFontSize(pdfSettings.fontSize);

        let y = margin;
        const lineHeightPt = pdfSettings.fontSize * pdfSettings.lineHeight;

        // Split text into lines that fit the page width
        const lines = doc.splitTextToSize(text, maxWidth);

        for (let i = 0; i < lines.length; i++) {
            // Check if we need a new page
            if (y + lineHeightPt > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            doc.text(lines[i], margin, y);
            y += lineHeightPt;
        }

        // Add page numbers if enabled
        if (pdfSettings.pageNumbers) {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 20,
                    { align: 'center' }
                );
            }
        }

        // Generate blob
        const pdfBlob = doc.output('blob');
        return pdfBlob;
    }

    async generateWithTOC(sections, filename = 'spokable-output.pdf') {
        await this.initJsPDF();

        const doc = new this.jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: settings.get('pdfPageSize')
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = settings.get('pdfMargin');
        const maxWidth = pageWidth - (margin * 2);

        // Add TOC page
        doc.setFontSize(20);
        doc.text('Table of Contents', margin, margin + 20);

        let tocY = margin + 50;
        doc.setFontSize(12);

        sections.forEach((section, index) => {
            doc.text(`${index + 1}. ${section.title}`, margin + 10, tocY);
            tocY += 20;
        });

        // Add sections
        sections.forEach(section => {
            doc.addPage();
            doc.setFontSize(16);
            doc.text(section.title, margin, margin + 20);

            doc.setFontSize(settings.get('pdfFontSize'));
            const lines = doc.splitTextToSize(section.content, maxWidth);

            let y = margin + 50;
            const lineHeight = settings.get('pdfFontSize') * settings.get('pdfLineHeight');

            lines.forEach(line => {
                if (y + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, margin, y);
                y += lineHeight;
            });
        });

        return doc.output('blob');
    }

    downloadPDF(blob, filename) {
        downloadFile(blob, filename);
    }
}

const pdfGenerator = new PDFGenerator();
