import { Observer } from './Observer.js';
import { LocalStorageWrapper } from './LocalStorageWrapper.js';
import { SCENARIOS, TODAYS_WORDS } from './ScenarioData.js';
import { getRandomCustomer, getRandomDialogue, evaluateCustomer } from '../data/CustomerData.js';

export const GameState = {
    WAITING: 'WAITING',
    GREETING: 'GREETING',
    ORDERING: 'ORDERING',
    BREWING: 'BREWING',
    SERVING: 'SERVING',
    EVALUATING: 'EVALUATING',
    CUSTOMER_RESULT: 'CUSTOMER_RESULT',
    SESSION_RESULT: 'SESSION_RESULT'
};

export class GameStore extends Observer {
    constructor() {
        super();
        this.storage = new LocalStorageWrapper();

        this.data = this.storage.load('gameData', {
            collectedWords: [],
            totalCustomers: 0,
            settings: { volume: 0.5, vibration: true }
        });

        this.state = GameState.WAITING;
        this.customersServed = 0;
        this.maxCustomers = 3;
        this.currentCustomer = null;
        this.currentScenario = null;
        this.sessionScores = [];
        this.todaysWord = null;

        this.brewData = {
            step: 'GRIND',
            grindLevel: 0,
            waterLevel: 0,
            temperature: 90
        };
    }

    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.publish({ type: 'STATE_CHANGE', payload: newState });
        }
    }

    startSession() {
        this.customersServed = 0;
        this.sessionScores = [];
        this.nextCustomer();
    }

    nextCustomer() {
        if (this.customersServed >= this.maxCustomers) {
            this.finishSession();
            return;
        }

        this.customersServed++;
        this.currentScenario = this.getRandomScenario();

        const customer = getRandomCustomer();
        this.currentCustomer = {
            ...customer,
            greetingLine: getRandomDialogue(customer, 'greeting'),
            orderLine: getRandomDialogue(customer, 'order'),
        };

        this.brewData = { step: 'GRIND', grindLevel: 0, waterLevel: 0 };

        this.setState(GameState.GREETING);

        this.greetingTimer = setTimeout(() => this.setState(GameState.ORDERING), 2000);
    }

    clearGreetingTimer() {
        if (this.greetingTimer) {
            clearTimeout(this.greetingTimer);
            this.greetingTimer = null;
        }
    }

    getRandomScenario() {
        return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    }

    updateBrewData(key, value) {
        this.brewData[key] = value;
        this.publish({ type: 'BREW_UPDATE', payload: { key, value } });
    }

    evaluateBrew() {
        const { waterLevel } = this.brewData;
        return evaluateCustomer(this.currentCustomer, waterLevel);
    }

    recordScore(score) {
        this.sessionScores.push(score);
    }

    finishSession() {
        const newWord = TODAYS_WORDS[Math.floor(Math.random() * TODAYS_WORDS.length)];
        if (!this.data.collectedWords.includes(newWord)) {
            this.data.collectedWords.push(newWord);
        }
        this.data.totalCustomers += this.customersServed;
        this.todaysWord = newWord;
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
