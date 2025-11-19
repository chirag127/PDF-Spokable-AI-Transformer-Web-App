/**
 * File Handler
 * Manages file upload, drag-and-drop, and file list UI
 */

class FileHandler {
    constructor() {
        this.selectedFiles = new Map();
        this.init();
    }

    init() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        if (!dropZone || !fileInput) return;

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            this.handleFiles(files);
        });

        // Click to open file picker
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // File actions
        document.getElementById('clear-files')?.addEventListener('click', () => {
            this.clearAll();
        });

        document.getElementById('download-selected')?.addEventListener('click', () => {
            this.downloadSelected();
        });
    }

    async handleFiles(files) {
        if (!files || files.length === 0) return;

        for (const file of files) {
            if (file.type !== 'application/pdf') {
                this.showError(`${file.name} is not a PDF file`);
                continue;
            }

            try {
                // Save to IndexedDB
                const id = await db.savePDF(file);

                // Add to selected files
                this.selectedFiles.set(id, {
                    id,
                    name: file.name,
                    size: file.size,
                    file
                });

                console.log(`[FileHandler] File added: ${file.name}`);
            } catch (error) {
                console.error('Error handling file:', error);
                this.showError(`Failed to process ${file.name}`);
            }
        }

        this.updateUI();
    }

    updateUI() {
        const selectedFilesSection = document.getElementById('selected-files');
        const filesList = document.getElementById('files-list');
        const conversionControls = document.getElementById('conversion-controls');

        if (this.selectedFiles.size === 0) {
            selectedFilesSection.style.display = 'none';
            conversionControls.style.display = 'none';
            return;
        }

        selectedFilesSection.style.display = 'block';
        conversionControls.style.display = 'flex';

        // Render file list
        filesList.innerHTML = '';
        this.selectedFiles.forEach((fileData, id) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">📄 ${fileData.name}</div>
                    <div class="file-meta">${formatBytes(fileData.size)}</div>
                </div>
                <button class="btn btn-danger btn-small" data-id="${id}">Remove</button>
            `;

            // Remove button
            fileItem.querySelector('button').addEventListener('click', () => {
                this.removeFile(id);
            });

            filesList.appendChild(fileItem);
        });
    }

    async removeFile(id) {
        try {
            await db.deletePDF(id);
            this.selectedFiles.delete(id);
            this.updateUI();
            console.log(`[FileHandler] File removed: ${id}`);
        } catch (error) {
            console.error('Error removing file:', error);
            this.showError('Failed to remove file');
        }
    }

    clearAll() {
        if (this.selectedFiles.size === 0) return;

        if (confirm('Remove all selected files?')) {
            this.selectedFiles.forEach((_, id) => {
                db.deletePDF(id).catch(console.error);
            });
            this.selectedFiles.clear();
            this.updateUI();
            console.log('[FileHandler] All files cleared');
        }
    }

    async downloadSelected() {
        if (this.selectedFiles.size === 0) return;

        for (const [id, fileData] of this.selectedFiles) {
            try {
                const pdfData = await db.getPDF(id);
                if (pdfData && pdfData.data) {
                    const blob = new Blob([pdfData.data], { type: 'application/pdf' });
                    downloadFile(blob, pdfData.filename);
                }
            } catch (error) {
                console.error('Error downloading file:', error);
            }
        }
    }

    getSelectedFiles() {
        return Array.from(this.selectedFiles.values());
    }

    showError(message) {
        // Show error in UI (could be improved with toast notifications)
        alert(message);
    }
}

// Create singleton instance
const fileHandler = new FileHandler();
