export class ViewManager {
    constructor() {
        this.screens = {
            loading: document.getElementById('loading-screen'),
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen')
        };

        this.overlays = {
            rotate: document.getElementById('rotate-overlay'),
            audioResume: document.getElementById('audio-resume-overlay')
        };
    }

    /**
     * Switch to the specified screen.
     * @param {string} screenName - The key of the screen to show (loading, start, game, result).
     */
    switchScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = this.screens[screenName];
        if (targetScreen) {
            targetScreen.classList.add('active');
        } else {
            console.error(`ViewManager: Screen "${screenName}" not found.`);
        }
    }

    /**
     * Show or hide a specific overlay.
     * @param {string} overlayName 
     * @param {boolean} show 
     */
    toggleOverlay(overlayName, show) {
        const overlay = this.overlays[overlayName];
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    /**
     * Fade out the entire game container (for reset).
     * @param {Function} callback - Function to execute after fade out.
     */
    fadeOutAndReset(callback) {
        const container = document.getElementById('game-container');
        container.style.transition = 'opacity 1s ease';
        container.style.opacity = '0';

        setTimeout(() => {
            if (callback) callback();
        }, 1000);
    }

    shakeElement(elementId, isShaking) {
        const el = document.getElementById(elementId);
        if (el) {
            if (isShaking) {
                // Simple random translation for shake
                const x = (Math.random() - 0.5) * 5;
                const y = (Math.random() - 0.5) * 5;
                el.style.transform = `translate(${x}px, ${y}px)`;
            } else {
                el.style.transform = 'none';
            }
        }
    }

    triggerScreenShake() {
        const container = document.getElementById('game-container');
        container.classList.add('shake-anim');
        setTimeout(() => {
            container.classList.remove('shake-anim');
        }, 500);
    }

    updateLiquidLevel(level) {
        const liquid = document.querySelector('.liquid');
        if (liquid) {
            // ScaleY from bottom
            liquid.style.transform = `scaleY(${level / 100})`;
        }
    }

    toggleGuide(show) {
        const cup = document.querySelector('.cup-container');
        if (cup) {
            if (show) cup.classList.add('guide-active');
            else cup.classList.remove('guide-active');
        }
    }
}
