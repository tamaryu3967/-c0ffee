import { GameState } from './GameStore.js';

export class GameController {
    constructor(store, viewManager, assetLoader, audioManager) {
        this.store = store;
        this.viewManager = viewManager;
        this.assetLoader = assetLoader;
        this.audioManager = audioManager;

        this.rafId = null;
        this.lastTime = 0;
        this.requireButtonRelease = false;
        this.autoTransitionTimer = null;
    }

    init() {
        this.store.subscribe((event) => {
            if (event.type === 'STATE_CHANGE') {
                this.handleStateChange(event);
            }
        });

        this.setupInput();
    }

    setupInput() {
        const actionBtn = document.getElementById('action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('pointerdown', (e) => this.handleActionStart(e));
            actionBtn.addEventListener('pointerup', (e) => this.handleActionEnd(e));
            actionBtn.addEventListener('pointerleave', (e) => this.handleActionEnd(e));
            actionBtn.addEventListener('pointercancel', (e) => this.handleActionEnd(e));
            actionBtn.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        const nextBtn = document.getElementById('next-customer-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.store.state === GameState.SESSION_RESULT) {
                    location.reload();
                } else {
                    this.store.nextCustomer();
                }
            });
        }
    }

    handleStateChange(data) {
        const newState = data.payload;

        if (newState === GameState.GREETING ||
            newState === GameState.ORDERING ||
            newState === GameState.CUSTOMER_RESULT) {
            this.resetPointerState();
        }

        switch (newState) {
            case GameState.WAITING:
                break;
            case GameState.GREETING:
                this.clearAutoTransition();
                this.viewManager.switchScreen('game');
                this.updateCustomerView();
                this.showDialogue(this.store.currentCustomer.greetingLine);
                document.getElementById('grinder').classList.add('hidden');
                document.getElementById('dripper').classList.add('hidden');
                document.getElementById('action-guide').classList.add('hidden');
                break;
            case GameState.ORDERING:
                this.clearAutoTransition();
                this.showDialogue(this.store.currentCustomer.orderLine);
                document.getElementById('grinder').classList.add('hidden');
                document.getElementById('dripper').classList.add('hidden');
                document.getElementById('action-guide').classList.add('hidden');
                this.autoTransitionTimer = setTimeout(() => {
                    if (this.store.state === GameState.ORDERING) {
                        this.store.setState(GameState.BREWING);
                    }
                }, 3000);
                break;
            case GameState.BREWING:
                this.showDialogue('...');
                this.setupBrewingUI();
                break;
            case GameState.SERVING:
                this.showDialogue('...');
                setTimeout(() => {
                    this.store.setState(GameState.CUSTOMER_RESULT);
                }, 1500);
                break;
            case GameState.CUSTOMER_RESULT:
                this.viewManager.switchScreen('result');
                this.updateCustomerResultView();
                break;
            case GameState.SESSION_RESULT:
                this.viewManager.switchScreen('result');
                this.updateSessionResultView();
                break;
        }
    }

    updateCustomerView() {
        const customer = this.store.currentCustomer;
        const customerName = document.getElementById('customer-name');
        if (customerName) customerName.textContent = customer.name;

        const counter = document.getElementById('customer-counter');
        if (counter) {
            counter.textContent = `${this.store.customersServed} / ${this.store.maxCustomers}`;
        }

        const placeholder = document.querySelector('.customer-placeholder');
        if (placeholder) {
            placeholder.className = `customer-placeholder customer-${customer.id}`;
        }
    }

    showDialogue(text) {
        const bubble = document.getElementById('dialogue-bubble');
        const textEl = document.getElementById('dialogue-text');
        if (bubble && textEl) {
            textEl.textContent = text;
            bubble.classList.remove('hidden');
        }
    }

    setupBrewingUI() {
        document.getElementById('grinder').classList.remove('hidden');
        document.getElementById('dripper').classList.add('hidden');

        const guide = document.getElementById('action-guide');
        if (guide) {
            guide.textContent = 'Hold to Grind';
            guide.classList.remove('hidden');
        }

        this.viewManager.updateLiquidLevel(0);
        this.viewManager.toggleGuide(false);
    }

    handleActionStart(e) {
        e.preventDefault();

        if (this.store.state === GameState.GREETING) {
            this.store.clearGreetingTimer();
            this.clearAutoTransition();
            this.store.setState(GameState.ORDERING);
            return;
        } else if (this.store.state === GameState.ORDERING) {
            this.clearAutoTransition();
            this.store.setState(GameState.BREWING);
            return;
        }

        if (this.store.state === GameState.BREWING) {
            if (this.requireButtonRelease) return;

            if (e.target.setPointerCapture) {
                e.target.setPointerCapture(e.pointerId);
            }
            e.target.style.transform = 'scale(0.95)';

            // Start appropriate sound
            const step = this.store.brewData.step;
            if (step === 'GRIND' && this.audioManager) {
                this.audioManager.startGrind();
            } else if (step === 'POUR' && this.audioManager) {
                this.audioManager.startPour();
            }

            if (!this.rafId) {
                this.lastTime = performance.now();
                this.gameLoop(this.lastTime);
            }
        }
    }

    handleActionEnd(e) {
        e.preventDefault();
        if (this.store.state === GameState.BREWING) {
            if (this.requireButtonRelease && this.store.brewData.step === 'GRIND') {
                this.requireButtonRelease = false;
                this.transitionToPour();
                e.target.style.transform = 'scale(1)';
                return;
            }

            if (this.store.brewData.step === 'POUR') {
                if (this.audioManager) this.audioManager.stopPour();
                const waterLevel = this.store.brewData.waterLevel;
                if (waterLevel >= 80 && waterLevel <= 100) {
                    this.finishPouring();
                    e.target.style.transform = 'scale(1)';
                    return;
                }
            }

            if (this.store.brewData.step === 'GRIND' && this.audioManager) {
                this.audioManager.stopGrind();
            }

            if (e.target.releasePointerCapture && e.target.hasPointerCapture &&
                e.target.hasPointerCapture(e.pointerId)) {
                e.target.releasePointerCapture(e.pointerId);
            }
            e.target.style.transform = 'scale(1)';

            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.store.state === GameState.BREWING) {
            const { step, grindLevel, waterLevel } = this.store.brewData;

            if (step === 'GRIND') {
                if (grindLevel < 100) {
                    const resistance = Math.random() < 0.1 ? 0.1 : 1.0;
                    const speed = 0.1 * deltaTime * resistance;
                    const newLevel = Math.min(100, grindLevel + speed);
                    this.store.updateBrewData('grindLevel', newLevel);
                    this.viewManager.shakeElement('grinder', true);

                    if (newLevel >= 100) {
                        this.finishGrinding();
                    }
                }
            } else if (step === 'POUR') {
                if (waterLevel < 100) {
                    const speed = 0.05 * deltaTime;
                    const newLevel = Math.min(100, waterLevel + speed);
                    this.store.updateBrewData('waterLevel', newLevel);
                    this.viewManager.updateLiquidLevel(newLevel);

                    this.viewManager.toggleGuide(newLevel > 75 && newLevel < 90);

                    if (newLevel >= 100) {
                        this.finishPouring();
                    }
                }
            }
        }

        this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    finishGrinding() {
        this.viewManager.shakeElement('grinder', false);
        this.viewManager.triggerScreenShake();

        if (navigator.vibrate) navigator.vibrate(200);
        if (this.audioManager) {
            this.audioManager.stopGrind();
            this.audioManager.playGrindComplete();
        }

        this.requireButtonRelease = true;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        const guide = document.getElementById('action-guide');
        if (guide) guide.textContent = 'Release to continue';
    }

    transitionToPour() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.store.updateBrewData('step', 'POUR');

        document.getElementById('grinder').classList.add('hidden');
        document.getElementById('dripper').classList.remove('hidden');
        const guide = document.getElementById('action-guide');
        if (guide) guide.textContent = 'Hold to Pour';

        this.requireButtonRelease = false;
    }

    finishPouring() {
        if (this.audioManager) this.audioManager.stopPour();
        this.resetPointerState();

        const evaluation = this.store.evaluateBrew();
        this.store.recordScore(evaluation.score);

        if (this.audioManager) this.audioManager.playChime(evaluation.score);

        setTimeout(() => {
            this.store.setState(GameState.SERVING);
        }, 1000);
    }

    resetPointerState() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        const actionBtn = document.getElementById('action-btn');
        if (actionBtn) actionBtn.style.transform = 'scale(1)';

        this.requireButtonRelease = false;
        this.clearAutoTransition();
    }

    clearAutoTransition() {
        if (this.autoTransitionTimer) {
            clearTimeout(this.autoTransitionTimer);
            this.autoTransitionTimer = null;
        }
    }

    updateCustomerResultView() {
        const evaluation = this.store.evaluateBrew();

        const starsDiv = document.querySelector('.stars');
        if (starsDiv) {
            starsDiv.textContent = '★'.repeat(evaluation.score) + '☆'.repeat(3 - evaluation.score);
        }

        const messageEl = document.getElementById('result-message');
        if (messageEl) messageEl.textContent = evaluation.message;

        document.getElementById('todays-word').classList.add('hidden');

        const nextBtn = document.getElementById('next-customer-btn');
        if (nextBtn) {
            if (this.store.customersServed >= this.store.maxCustomers) {
                nextBtn.textContent = 'Finish Session';
                nextBtn.onclick = () => this.store.finishSession();
            } else {
                nextBtn.textContent = 'Next Customer';
                nextBtn.onclick = null;
            }
        }
    }

    updateSessionResultView() {
        const scores = this.store.sessionScores;
        const avg = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 2;

        const starsDiv = document.querySelector('.stars');
        if (starsDiv) {
            starsDiv.textContent = '★'.repeat(avg) + '☆'.repeat(3 - avg);
        }

        const messages = {
            0: '次はもっとうまくいきます。',
            1: 'まあまあな一日でした。',
            2: 'なかなか良い一日でした。',
            3: '完璧な一日でした！'
        };
        const messageEl = document.getElementById('result-message');
        if (messageEl) messageEl.textContent = messages[avg] || messages[2];

        const wordCard = document.getElementById('todays-word');
        const wordText = document.getElementById('word-text');
        if (wordCard) wordCard.classList.remove('hidden');
        if (wordText && this.store.todaysWord) {
            wordText.textContent = this.store.todaysWord;
        }

        const nextBtn = document.getElementById('next-customer-btn');
        if (nextBtn) {
            nextBtn.textContent = 'Back to Title';
            nextBtn.onclick = null;
        }
    }
}
