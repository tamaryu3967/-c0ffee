import { ViewManager } from './ViewManager.js';
import { Observer } from './Observer.js';
import { AssetLoader } from './AssetLoader.js';
import { GameStore } from './GameStore.js';
import { GameController } from './GameController.js';

class App {
    constructor() {
        this.viewManager = new ViewManager();
        this.eventBus = new Observer();

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();

        this.assetLoader = new AssetLoader(this.audioContext);
        this.store = new GameStore();
        this.gameController = new GameController(this.store, this.viewManager, this.assetLoader);

        this.manifest = {
            images: {},
            audio: {}
        };
    }

    async init() {
        console.log('#c0ffee: App started');

        this.setupEventListeners();
        this.setupVisibilityHandler();

        // Initialize Controller
        this.gameController.init();

        this.viewManager.switchScreen('loading');
        await this.assetLoader.loadAll(this.manifest);

        setTimeout(() => {
            this.viewManager.switchScreen('start');
        }, 500);
    }

    setupEventListeners() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        const resumeOverlay = document.getElementById('audio-resume-overlay');
        if (resumeOverlay) {
            resumeOverlay.addEventListener('click', () => {
                this.resumeAudioContext();
                this.viewManager.toggleOverlay('audioResume', false);
            });
        }

        // Backup Button
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                const code = this.store.getBackupCode();
                if (code) {
                    navigator.clipboard.writeText(code).then(() => {
                        alert('Backup code copied to clipboard!');
                    }).catch(err => {
                        console.error('Failed to copy backup code', err);
                        alert('Failed to copy code. Check console.');
                    });
                }
            });
        }

        // Share Button
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: '#c0ffee',
                            text: 'Relaxing coffee brewing simulation.',
                            url: window.location.href
                        });
                    } catch (err) {
                        console.log('Share canceled', err);
                    }
                } else {
                    alert('Web Share API not supported on this device.');
                }
            });
        }
    }

    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.audioContext && this.audioContext.state === 'running') {
                    this.audioContext.suspend();
                }
            } else {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.viewManager.toggleOverlay('audioResume', true);
                }
            }
        });
    }

    async startGame() {
        console.log('#c0ffee: Game Started');
        await this.resumeAudioContext();

        // Start the session via Store
        this.store.startSession();
    }

    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('AudioContext resumed');
            } catch (e) {
                console.error('Failed to resume AudioContext', e);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    window.app = app;
});
