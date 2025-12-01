import { GameState } from './GameStore.js';

export class GameController {
    constructor(store, viewManager, assetLoader) {
        this.store = store;
        this.viewManager = viewManager;
        this.assetLoader = assetLoader;

        this.rafId = null;
        this.lastTime = 0;
        this.requireButtonRelease = false; // Grind完了時にボタンリリースを要求するフラグ
        this.autoTransitionTimer = null; // 自動遷移用タイマーID
    }

    init() {
        // Subscribe to Store changes
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
            // Unified Pointer Events
            actionBtn.addEventListener('pointerdown', (e) => this.handleActionStart(e));
            actionBtn.addEventListener('pointerup', (e) => this.handleActionEnd(e));
            actionBtn.addEventListener('pointerleave', (e) => this.handleActionEnd(e));
            actionBtn.addEventListener('pointercancel', (e) => this.handleActionEnd(e));

            // Prevent context menu on long press
            actionBtn.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        const nextBtn = document.getElementById('next-customer-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.store.state === GameState.SESSION_RESULT) {
                    // Back to Title
                    location.reload(); // Simple reset for MVP
                } else {
                    this.store.nextCustomer();
                }
            });
        }
    }

    handleStateChange(data) {
        const newState = data.payload;

        // ポインター状態をリセット（バグ修正）
        if (newState === GameState.GREETING ||
            newState === GameState.ORDERING ||
            newState === GameState.CUSTOMER_RESULT) {
            this.resetPointerState();
        }

        switch (newState) {
            case GameState.WAITING:
                // Should not happen in session usually
                break;
            case GameState.GREETING:
                this.clearAutoTransition(); // 既存タイマーをクリア
                this.viewManager.switchScreen('game');
                this.updateCustomerView();
                this.showDialogue(this.store.currentScenario.greeting);
                // 会話フェーズでは装備UIを非表示
                document.getElementById('grinder').classList.add('hidden');
                document.getElementById('dripper').classList.add('hidden');
                const guideGreeting = document.getElementById('action-guide');
                if (guideGreeting) guideGreeting.classList.add('hidden');
                break;
            case GameState.ORDERING:
                console.log('ORDERING状態: タイマークリア前 ID=', this.autoTransitionTimer);
                this.clearAutoTransition(); // 既存タイマーをクリア
                this.showDialogue(this.store.currentScenario.order);
                // 会話フェーズでは装備UIを非表示
                document.getElementById('grinder').classList.add('hidden');
                document.getElementById('dripper').classList.add('hidden');
                const guideOrdering = document.getElementById('action-guide');
                if (guideOrdering) guideOrdering.classList.add('hidden');
                // Show hint or transition to brewing after delay/tap
                // For MVP, auto transition to Brewing setup
                this.autoTransitionTimer = setTimeout(() => {
                    console.log('タイマー実行: 現在の状態=', this.store.state);
                    if (this.store.state === GameState.ORDERING) { // 状態チェック
                        console.log('自動遷移: ORDERING -> BREWING');
                        this.store.setState(GameState.BREWING);
                    } else {
                        console.log('自動遷移キャンセル: 状態が変わっている');
                    }
                }, 3000);
                console.log('ORDERING状態: 新タイマー設定 ID=', this.autoTransitionTimer);
                break;
            case GameState.BREWING:
                this.showDialogue("..."); // Quiet while brewing
                this.setupBrewingUI();
                break;
            case GameState.SERVING:
                // Show serving animation (cup sliding to customer)
                // For MVP, just wait a bit then go to result
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
        const customerName = document.getElementById('customer-name');
        if (customerName) customerName.textContent = this.store.currentCustomer.name;

        // Update visual placeholder color/style based on variant
        const placeholder = document.querySelector('.customer-placeholder');
        if (placeholder) {
            const hue = this.store.currentCustomer.variant * 120;
            placeholder.style.backgroundColor = `hsl(${hue}, 40%, 60%)`;
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
        // Show Grinder first
        document.getElementById('grinder').classList.remove('hidden');
        document.getElementById('dripper').classList.add('hidden');

        const guide = document.getElementById('action-guide');
        if (guide) {
            guide.textContent = "Hold to Grind";
            guide.classList.remove('hidden');
        }

        // 液体レベルをリセット
        this.viewManager.updateLiquidLevel(0);
        this.viewManager.toggleGuide(false);
    }

    handleActionStart(e) {
        e.preventDefault();
        console.log('Action Start Event:', e.type, this.store.state);

        // GREETING/ORDERING状態ではACTIONボタンで会話を進める
        if (this.store.state === GameState.GREETING) {
            console.log('会話スキップ: GREETING -> ORDERING');
            this.store.clearGreetingTimer(); // GameStoreのタイマーもクリア
            this.clearAutoTransition(); // 自動遷移をキャンセル
            this.store.setState(GameState.ORDERING);
            return;
        } else if (this.store.state === GameState.ORDERING) {
            console.log('会話スキップ: ORDERING -> BREWING');
            this.clearAutoTransition(); // 自動遷移をキャンセル
            this.store.setState(GameState.BREWING);
            return;
        }

        if (this.store.state === GameState.BREWING) {
            // ボタンリリース待機中は新しいアクションを開始しない
            if (this.requireButtonRelease) {
                console.log('ボタンリリース待機中: アクション開始を無視');
                return;
            }

            // Logic for Grinding or Pouring
            console.log('Action Start: Logic Triggered');

            // Capture pointer to handle drag/leave correctly
            if (e.target.setPointerCapture) {
                e.target.setPointerCapture(e.pointerId);
            }

            e.target.style.transform = 'scale(0.95)';

            // Start Loop
            if (!this.rafId) {
                this.lastTime = performance.now();
                this.gameLoop(this.lastTime);
            }
        }
    }

    handleActionEnd(e) {
        e.preventDefault();
        console.log('Action End Event:', e.type);
        if (this.store.state === GameState.BREWING) {
            // Grind完了後、ボタンリリースでPourに遷移
            if (this.requireButtonRelease && this.store.brewData.step === 'GRIND') {
                console.log('ボタンリリース検出: GRIND -> POUR遷移');
                this.requireButtonRelease = false;
                this.transitionToPour();
                e.target.style.transform = 'scale(1)';
                return;
            }

            // Pour状態でボタンを離した時、80-100%なら成功
            if (this.store.brewData.step === 'POUR') {
                const waterLevel = this.store.brewData.waterLevel;
                if (waterLevel >= 80 && waterLevel <= 100) {
                    console.log(`Pour完了: ${waterLevel.toFixed(1)}% (成功範囲)`);
                    this.finishPouring();
                    e.target.style.transform = 'scale(1)';
                    return;
                }
            }

            // Release pointer capture
            if (e.target.releasePointerCapture && e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
                e.target.releasePointerCapture(e.pointerId);
            }

            e.target.style.transform = 'scale(1)';

            // Stop Loop
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
                    // Grind Logic
                    // Resistance: Randomly slow down
                    const resistance = Math.random() < 0.1 ? 0.1 : 1.0;
                    const speed = 0.1 * deltaTime * resistance;

                    let newLevel = Math.min(100, grindLevel + speed);
                    this.store.updateBrewData('grindLevel', newLevel);

                    // Debug Log
                    if (Math.floor(newLevel) % 10 === 0) {
                        console.log(`Grinding: ${newLevel.toFixed(1)}%`);
                    }

                    // Visual Feedback: Shake Grinder
                    this.viewManager.shakeElement('grinder', true);

                    if (newLevel >= 100) {
                        // Finished Grinding
                        this.finishGrinding();
                    }
                }
            } else if (step === 'POUR') {
                if (waterLevel < 100) {
                    // Pour Logic
                    const speed = 0.05 * deltaTime;
                    let newLevel = Math.min(100, waterLevel + speed);
                    this.store.updateBrewData('waterLevel', newLevel);

                    // Visual Feedback: Update Liquid
                    this.viewManager.updateLiquidLevel(newLevel);

                    // Guide: Green Glow near 80%
                    if (newLevel > 75 && newLevel < 90) {
                        this.viewManager.toggleGuide(true);
                    } else {
                        this.viewManager.toggleGuide(false);
                    }

                    if (newLevel >= 100) {
                        // Overflow / Auto Stop
                        this.finishPouring();
                    }
                }
            }
        }

        this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    finishGrinding() {
        console.log('Grinding Complete');
        this.viewManager.shakeElement('grinder', false);
        this.viewManager.triggerScreenShake();

        if (navigator.vibrate) navigator.vibrate(200);

        // ボタンを離すことを要求
        this.requireButtonRelease = true;

        // gameLoopを一時停止
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // ガイドテキストを更新
        const guide = document.getElementById('action-guide');
        if (guide) {
            guide.textContent = "Release button to continue";
        }
    }

    transitionToPour() {
        // 確実にgameLoopを停止
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.store.updateBrewData('step', 'POUR');

        // UI更新（イベント駆動: 即座に実行）
        document.getElementById('grinder').classList.add('hidden');
        document.getElementById('dripper').classList.remove('hidden');
        const guide = document.getElementById('action-guide');
        if (guide) {
            guide.textContent = "Hold to Pour";
        }

        // Pourフェーズでは再度ボタンを押すまで何もしない
        this.requireButtonRelease = false;
    }

    finishPouring() {
        console.log('Pouring Complete');

        // ポインター状態をリセット
        this.resetPointerState();

        // Transition to Serving
        setTimeout(() => {
            this.store.setState(GameState.SERVING);
        }, 1000);
    }

    resetPointerState() {
        // gameLoopを停止
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // ボタンのスタイルをリセット
        const actionBtn = document.getElementById('action-btn');
        if (actionBtn) {
            actionBtn.style.transform = 'scale(1)';
        }

        // フラグをリセット
        this.requireButtonRelease = false;

        // 自動遷移タイマーもクリア
        this.clearAutoTransition();
    }

    clearAutoTransition() {
        // 自動遷移タイマーをクリア
        if (this.autoTransitionTimer) {
            console.log('タイマークリア: ID=', this.autoTransitionTimer);
            clearTimeout(this.autoTransitionTimer);
            this.autoTransitionTimer = null;
        } else {
            console.log('タイマークリア: タイマーなし');
        }
    }

    updateCustomerResultView() {
        const evaluation = this.store.evaluateBrew();

        // Update stars
        const starsDiv = document.querySelector('.stars');
        if (starsDiv) {
            starsDiv.textContent = '★'.repeat(evaluation.score) + '☆'.repeat(3 - evaluation.score);
        }

        // Update message
        const messageEl = document.getElementById('result-message');
        if (messageEl) messageEl.textContent = evaluation.message;

        // Show/Hide Today's Word
        document.getElementById('todays-word').classList.add('hidden');

        // Update button text
        const nextBtn = document.getElementById('next-customer-btn');
        if (nextBtn) {
            if (this.store.customersServed >= this.store.maxCustomers) {
                nextBtn.textContent = 'Finish Session';
                nextBtn.onclick = () => this.store.finishSession();
            } else {
                nextBtn.textContent = 'Next Customer';
            }
        }
    }

    updateSessionResultView() {
        // Update stars (final score or summary)
        const starsDiv = document.querySelector('.stars');
        if (starsDiv) starsDiv.textContent = '★★★';

        // Update message
        const messageEl = document.getElementById('result-message');
        if (messageEl) messageEl.textContent = 'Session Complete!';

        // Show Today's Word
        const wordCard = document.getElementById('todays-word');
        if (wordCard) wordCard.classList.remove('hidden');

        // Update button
        const nextBtn = document.getElementById('next-customer-btn');
        if (nextBtn) nextBtn.textContent = 'Back to Title';
    }
}
