import { Observer } from './Observer.js';
import { LocalStorageWrapper } from './LocalStorageWrapper.js';
import { SCENARIOS, TODAYS_WORDS } from './ScenarioData.js';

export const GameState = {
    WAITING: 'WAITING',       // Waiting for customer
    GREETING: 'GREETING',     // Customer enters and greets
    ORDERING: 'ORDERING',     // Customer orders
    BREWING: 'BREWING',       // Grinding and Pouring phase
    SERVING: 'SERVING',       // Serving coffee
    EVALUATING: 'EVALUATING', // Customer reacts
    CUSTOMER_RESULT: 'CUSTOMER_RESULT', // Result for single customer
    SESSION_RESULT: 'SESSION_RESULT'    // End of session (Today's word)
};

export class GameStore extends Observer {
    constructor() {
        super();
        this.storage = new LocalStorageWrapper();

        // Persistent Data
        this.data = this.storage.load('gameData', {
            collectedWords: [],
            totalCustomers: 0,
            settings: { volume: 0.5, vibration: true }
        });

        // Session State
        this.state = GameState.WAITING;
        this.customersServed = 0;
        this.maxCustomers = 3;
        this.currentCustomer = null;
        this.currentScenario = null;

        // Brewing State
        this.brewData = {
            step: 'GRIND', // GRIND or POUR
            grindLevel: 0, // 0-100
            waterLevel: 0, // 0-100
            temperature: 90
        };
    }

    setState(newState) {
        if (this.state !== newState) {
            console.log(`GameStore: State changed ${this.state} -> ${newState}`);
            this.state = newState;
            this.publish({ type: 'STATE_CHANGE', payload: newState });
        }
    }

    startSession() {
        this.customersServed = 0;
        this.nextCustomer();
    }

    nextCustomer() {
        if (this.customersServed >= this.maxCustomers) {
            this.finishSession();
            return;
        }

        this.customersServed++;
        this.currentScenario = this.getRandomScenario();
        this.currentCustomer = {
            name: ['田中', '佐藤', '鈴木'][Math.floor(Math.random() * 3)],
            variant: Math.floor(Math.random() * 3) // 0, 1, 2 for image variants
        };

        // Reset Brew Data
        this.brewData = { step: 'GRIND', grindLevel: 0, waterLevel: 0 };

        this.setState(GameState.GREETING);

        // Auto progress for demo - タイマーIDを保存
        this.greetingTimer = setTimeout(() => this.setState(GameState.ORDERING), 2000);
    }

    clearGreetingTimer() {
        if (this.greetingTimer) {
            clearTimeout(this.greetingTimer);
            this.greetingTimer = null;
        }
    }

    getRandomScenario() {
        // Simple random for MVP
        return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    }

    updateBrewData(key, value) {
        this.brewData[key] = value;
        this.publish({ type: 'BREW_UPDATE', payload: { key, value } });
    }

    evaluateBrew() {
        const { waterLevel } = this.brewData;
        let score = 0;
        let message = "";
        let mood = "neutral";

        if (waterLevel < 50) {
            score = 1;
            message = "A bit light, but gentle.";
            mood = "neutral";
        } else if (waterLevel < 75) {
            score = 2;
            message = "Good balance.";
            mood = "happy";
        } else if (waterLevel <= 90) {
            score = 3;
            message = "Perfect Brew!";
            mood = "ecstatic";
        } else {
            score = 2;
            message = "Strong and bold!";
            mood = "surprised";
        }

        return { score, message, mood };
    }

    finishSession() {
        // Collect a word
        const newWord = TODAYS_WORDS[Math.floor(Math.random() * TODAYS_WORDS.length)];
        if (!this.data.collectedWords.includes(newWord)) {
            this.data.collectedWords.push(newWord);
        }
        this.data.totalCustomers += this.customersServed;
        this.saveData();

        this.setState(GameState.SESSION_RESULT);
        this.publish({ type: 'SESSION_COMPLETE', payload: { word: newWord } });
    }

    saveData() {
        this.storage.save('gameData', this.data);
    }

    getBackupCode() {
        return this.storage.exportBackup();
    }
}
