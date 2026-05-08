import { ViewManager } from './ViewManager.js';
import { Observer } from './Observer.js';
import { AssetLoader } from './AssetLoader.js';
import { AudioManager } from './AudioManager.js';
import { GameStore } from './GameStore.js';
import { GameController } from './GameController.js';

class App {
    constructor() {
        this.viewManager = new ViewManager();
        this.eventBus = new Observer();

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.audioManager = new AudioManager(this.audioContext);

        this.assetLoader = new AssetLoader(this.audioContext);
        this.store = new GameStore();
        this.gameController = new GameController(
            this.store,
            this.viewManager,
            this.assetLoader,
            this.audioManager
        );

        this.manifest = { images: {}, audio: {} };
    }

    async init() {
        this.setupEventListeners();
        this.setupVisibilityHandler();

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
                this.audioManager.playClick();
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

        // Menu button
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.audioManager.playClick();
                const overlay = document.getElementById('menu-overlay');
                if (overlay) overlay.classList.remove('hidden');
                // Update stats
                const totalEl = document.getElementById('menu-total-customers');
                if (totalEl) {
                    totalEl.textContent = `通算 ${this.store.data.totalCustomers} 人のお客様`;
                }
            });
        }

        const menuCloseBtn = document.getElementById('menu-close-btn');
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', () => {
                this.audioManager.playClick();
                document.getElementById('menu-overlay').classList.add('hidden');
            });
        }

        const menuRestartBtn = document.getElementById('menu-restart-btn');
        if (menuRestartBtn) {
            menuRestartBtn.addEventListener('click', () => {
                location.reload();
            });
        }

        // Backup / Share (optional features)
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                const code = this.store.getBackupCode();
                if (code) {
                    navigator.clipboard.writeText(code).catch(() => {});
                }
            });
        }

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
                    } catch (_) {}
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
        await this.resumeAudioContext();
        this.store.startSession();
    }

    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (_) {}
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    window.app = app;
});
