/**
 * TTS Player
 * In-browser text-to-speech playback
 */

class TTSPlayer {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.paragraphs = [];
        this.currentIndex = 0;
        this.isPlaying = false;
    }

    loadText(text) {
        // Split into paragraphs
        this.paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        this.currentIndex = 0;
        this.updateUI();
    }

    play() {
        if (this.paragraphs.length === 0) return;

        if (this.synth.speaking) {
            this.synth.resume();
            this.isPlaying = true;
            this.updatePlayButton();
            return;
        }

        this.speakParagraph(this.currentIndex);
    }

    pause() {
        if (this.synth.speaking) {
            this.synth.pause();
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    stop() {
        this.synth.cancel();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    next() {
        this.stop();
        if (this.currentIndex < this.paragraphs.length - 1) {
            this.currentIndex++;
            this.speakParagraph(this.currentIndex);
        }
    }

    previous() {
        this.stop();
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.speakParagraph(this.currentIndex);
        }
    }

    seek(index) {
        this.stop();
        this.currentIndex = Math.max(0, Math.min(index, this.paragraphs.length - 1));
        this.speakParagraph(this.currentIndex);
    }

    speakParagraph(index) {
        if (index >= this.paragraphs.length) {
            this.stop();
            return;
        }

        const text = this.paragraphs[index];
        this.utterance = new SpeechSynthesisUtterance(text);

        this.utterance.onend = () => {
            if (this.currentIndex < this.paragraphs.length - 1) {
                this.currentIndex++;
                this.speakParagraph(this.currentIndex);
            } else {
                this.isPlaying = false;
                this.updatePlayButton();
            }
        };

        this.utterance.onerror = (error) => {
            console.error('TTS error:', error);
            this.isPlaying = false;
            this.updatePlayButton();
        };

        this.synth.speak(this.utterance);
        this.isPlaying = true;
        this.updateUI();
        this.updatePlayButton();
    }

    updateUI() {
        const currentPara = document.getElementById('audio-current-para');
        const seekBar = document.getElementById('audio-seek');

        if (currentPara) {
            currentPara.textContent = `Paragraph ${this.currentIndex + 1} of ${this.paragraphs.length}`;
        }

        if (seekBar) {
            seekBar.max = this.paragraphs.length - 1;
            seekBar.value = this.currentIndex;
        }
    }

    updatePlayButton() {
        const playBtn = document.getElementById('audio-play-pause');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play';
        }
    }

    initUI() {
        const playBtn = document.getElementById('audio-play-pause');
        const prevBtn = document.getElementById('audio-prev');
        const nextBtn = document.getElementById('audio-next');
        const seekBar = document.getElementById('audio-seek');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        if (seekBar) {
            seekBar.addEventListener('change', (e) => {
                this.seek(parseInt(e.target.value));
            });
        }
    }
}

const ttsPlayer = new TTSPlayer();

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        ttsPlayer.initUI();
    });
}
