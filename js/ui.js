/**
 * UI Controller
 * Manages UI updates, progress display, and user interactions
 */

class UIController {
    constructor() {
        this.progressSection = document.getElementById('progress-section');
        this.resultsSection = document.getElementById('results-section');
        this.logOutput = document.getElementById('log-output');
        this.isPaused = false;
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.resultsSection.style.display = 'none';
        document.getElementById('conversion-controls').style.display = 'none';
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
    }

    showResults() {
        this.hideProgress();
        this.resultsSection.style.display = 'block';
    }

    updateProgress(stage, stagePercent, overallPercent) {
        document.getElementById('progress-stage').textContent = stage;
        document.getElementById('stage-progress').style.width = `${stagePercent}%`;
        document.getElementById('stage-percent').textContent = `${Math.round(stagePercent)}%`;
        document.getElementById('overall-progress').style.width = `${overallPercent}%`;
        document.getElementById('overall-percent').textContent = `${Math.round(overallPercent)}%`;
    }

    addLog(message, level = 'info') {
        if (!this.logOutput) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${level}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

        this.logOutput.appendChild(entry);
        this.logOutput.scrollTop = this.logOutput.scrollHeight;

        // Keep only last 100 entries
        while (this.logOutput.children.length > 100) {
            this.logOutput.removeChild(this.logOutput.firstChild);
        }
    }

    clearLog() {
        if (this.l {
            this.logOutput.innerHTML = '';
        }
    }

    showError(message) {
        this.addLog(message, 'error');
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        this.addLog(message, 'success');
    }

    showWarning(message) {
        this.addLog(message, 'warning');
    }

    setPaused(paused) {
        this.isPaused = paused;
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        }
    }

    showOnboarding() {
        const banner = document.getElementById('onboarding-banner');
        if (banner && !settings.get('onboardingCompleted')) {
            banner.style.display = 'block';
        }
    }

    hideOnboarding() {
        const banner = document.getElementById('onboarding-banner');
        if (banner) {
            banner.style.display = 'none';
        }
        settings.set('onboardingCompleted', true);
    }

    showWalkthrough() {
        const modal = document.getElementById('walkthrough-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadWalkthroughStep(0);
        }
    }

    loadWalkthroughStep(step) {
        const steps = [
            {
                title: 'Get Your API Key',
                content: `
                    <h3>Step 1: Get Your Google AI Studio API Key</h3>
                    <p>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a> to create a free API key.</p>
                    <ol>
                        <li>Sign in with your Google account</li>
                        <li>Click "Create API Key"</li>
                        <li>Copy the generated key</li>
                    </ol>
                `
            },
            {
                title: 'Configure Settings',
                content: `
                    <h3>Step 2: Enter Your API Key</h3>
                    <p>Click the Settings button and paste your API key in the "API Configuration" tab.</p>
                    <p>You can also configure processing options and prompts to customize the transformation.</p>
                `
            },
            {
                title: 'Upload PDF',
                content: `
                    <h3>Step 3: Upload Your PDF</h3>
                    <p>Drag and drop a PDF file or click "Choose Files" to select one.</p>
                    <p>The PDF must contain selectable text (no OCR required).</p>
                `
            },
            {
                title: 'Convert',
                content: `
                    <h3>Step 4: Convert to Spokable PDF</h3>
                    <p>Click "Convert to Spokable PDF" to start the transformation.</p>
                    <p>Watch the progress and download your TTS-friendly PDF when complete!</p>
                `
            }
        ];

        const content = document.getElementById('walkthrough-content');
        if (content && steps[step]) {
            content.innerHTML = steps[step].content;
        }

        const prevBtn = document.getElementById('walkthrough-prev');
        const nextBtn = document.getElementById('walkthrough-next');

        if (prevBtn) {
            prevBtn.disabled = step === 0;
            prevBtn.onclick = () => this.loadWalkthroughStep(step - 1);
        }

        if (nextBtn) {
            nextBtn.textContent = step === steps.length - 1 ? 'Finish' : 'Next';
            nextBtn.onclick = () => {
                if (step === steps.length - 1) {
                    this.closeWalkthrough();
                } else {
                    this.loadWalkthroughStep(step + 1);
                }
            };
        }
    }

    closeWalkthrough() {
        const modal = document.getElementById('walkthrough-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.hideOnboarding();
    }
}

const uiController = new UIController();

// Initialize UI event listeners
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Onboarding
        document.getElementById('start-walkthrough')?.addEventListener('click', () => {
            uiController.showWalkthrough();
        });

        document.getElementById('dismiss-onboarding')?.addEventListener('click', () => {
            uiController.hideOnboarding();
        });

        document.getElementById('walkthrough-skip')?.addEventListener('click', () => {
            uiController.closeWalkthrough();
        });

        // Close walkthrough modal
        document.querySelectorAll('#walkthrough-modal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => uiController.closeWalkthrough());
        });

        // Show onboarding if first time
        uiController.showOnboarding();
    });
}
