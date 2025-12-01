/**
 * CustomerData.js
 * 客の詳細情報を管理するデータファイル
 */

/**
 * 客の性格タイプ
 */
export const CustomerPersonality = {
    CHEERFUL: 'cheerful',      // 明るい・社交的
    SHY: 'shy',                // 内気・控えめ
    STRICT: 'strict',          // 厳しい・こだわり強い
    RELAXED: 'relaxed',        // のんびり・おおらか
    BUSINESSLIKE: 'businesslike' // ビジネスライク・効率的
};

/**
 * 客のコーヒー好み
 */
export const CoffeePreference = {
    LIGHT: 'light',      // 薄め好き
    BALANCED: 'balanced', // バランス好き
    STRONG: 'strong'     // 濃いめ好き
};

/**
 * 客の詳細データ
 */
export const CUSTOMERS = [
    {
        id: 'tanaka',
        name: '田中',
        personality: CustomerPersonality.CHEERFUL,
        preference: CoffeePreference.BALANCED,
        description: '常連の会社員。いつも元気で明るい。',

        // セリフバリエーション
        dialogues: {
            greeting: [
                'おはようございます！',
                'こんにちは！今日も一日頑張ります！',
                'いい天気ですね～'
            ],
            order: [
                'いつものコーヒーをお願いします。',
                'コーヒー一杯、お願いできますか？',
                '今日もコーヒーで元気出します！'
            ],
            reaction: {
                perfect: 'わあ！完璧ですね！最高です！',
                good: 'うん、美味しい！ありがとうございます。',
                okay: 'いい感じですね。ごちそうさまです。',
                bad: 'うーん…まあ、大丈夫です。'
            }
        },

        // 評価基準（この客特有の傾向）
        evaluationTendency: {
            perfectRange: [75, 90],  // この範囲で満点
            goodRange: [60, 95],      // この範囲で高評価
            tolerance: 'medium'       // 許容度
        },

        // 画像パス（将来的に使用）
        imagePath: 'assets/customers/tanaka.png',
        variants: 3  // 表情バリエーション数
    },

    {
        id: 'sato',
        name: '佐藤',
        personality: CustomerPersonality.SHY,
        preference: CoffeePreference.LIGHT,
        description: '控えめな学生。読書が好き。',

        dialogues: {
            greeting: [
                'あ、こんにちは…',
                'お邪魔します…',
                'すみません…'
            ],
            order: [
                'コーヒーを…一杯…',
                'えっと、コーヒーください…',
                '…お願いします…'
            ],
            reaction: {
                perfect: 'わあ…すごく美味しいです…！',
                good: '美味しいです。ありがとうございます…',
                okay: 'ごちそうさまでした…',
                bad: 'あ、はい…大丈夫です…'
            }
        },

        evaluationTendency: {
            perfectRange: [70, 85],
            goodRange: [50, 90],
            tolerance: 'high'  // 優しい評価
        },

        imagePath: 'assets/customers/sato.png',
        variants: 3
    },

    {
        id: 'suzuki',
        name: '鈴木',
        personality: CustomerPersonality.STRICT,
        preference: CoffeePreference.STRONG,
        description: 'コーヒー通の会社役員。品質にこだわる。',

        dialogues: {
            greeting: [
                'やあ。',
                'いつもお世話になっています。',
                '本日も宜しく。'
            ],
            order: [
                'コーヒーを。しっかりと抽出してください。',
                'いつものやつ、頼むよ。',
                'コーヒー一杯。丁寧にね。'
            ],
            reaction: {
                perfect: '素晴らしい。これだよ、これ。',
                good: 'うん、悪くない。',
                okay: 'まあ、こんなものか。',
                bad: 'うーん…もう少し精進が必要だね。'
            }
        },

        evaluationTendency: {
            perfectRange: [80, 90],  // 厳しい
            goodRange: [70, 95],
            tolerance: 'low'  // 厳しい評価
        },

        imagePath: 'assets/customers/suzuki.png',
        variants: 3
    },

    {
        id: 'yamada',
        name: '山田',
        personality: CustomerPersonality.RELAXED,
        preference: CoffeePreference.BALANCED,
        description: '作家志望のフリーター。のんびり屋。',

        dialogues: {
            greeting: [
                'よっす～',
                'どーも～',
                'やあやあ'
            ],
            order: [
                'コーヒーちょうだい～',
                'いつものやつで～',
                'コーヒー一杯、お願いしまーす'
            ],
            reaction: {
                perfect: 'おお！これはいいね！',
                good: 'うん、美味しいよ～',
                okay: 'サンキュー、いただきます',
                bad: 'まあ、コーヒーはコーヒーだからね'
            }
        },

        evaluationTendency: {
            perfectRange: [75, 90],
            goodRange: [50, 100],  // 幅広く許容
            tolerance: 'high'
        },

        imagePath: 'assets/customers/yamada.png',
        variants: 3
    },

    {
        id: 'nakamura',
        name: '中村',
        personality: CustomerPersonality.BUSINESSLIKE,
        preference: CoffeePreference.STRONG,
        description: 'ビジネスパーソン。効率重視。',

        dialogues: {
            greeting: [
                'こんにちは。',
                '時間がないので手短に。',
                '急いでいます。'
            ],
            order: [
                'コーヒー、ブラックで。',
                'いつものを、早めにお願いします。',
                'コーヒー一杯、すぐに。'
            ],
            reaction: {
                perfect: 'Perfect. 助かります。',
                good: 'Good. ありがとう。',
                okay: 'OK. では失礼。',
                bad: '…次回に期待します。'
            }
        },

        evaluationTendency: {
            perfectRange: [78, 92],
            goodRange: [65, 100],
            tolerance: 'medium'
        },

        imagePath: 'assets/customers/nakamura.png',
        variants: 3
    }
];

/**
 * ランダムに客を取得
 */
export function getRandomCustomer() {
    return CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
}

/**
 * IDで客を取得
 */
export function getCustomerById(id) {
    return CUSTOMERS.find(customer => customer.id === id);
}

/**
 * 性格タイプでフィルタリング
 */
export function getCustomersByPersonality(personality) {
    return CUSTOMERS.filter(customer => customer.personality === personality);
}

/**
 * 客からランダムなセリフを取得
 */
export function getRandomDialogue(customer, type) {
    const dialogues = customer.dialogues[type];
    if (Array.isArray(dialogues)) {
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    return dialogues;
}

/**
 * 客の評価を取得（抽出レベルに基づく）
 */
export function evaluateCustomer(customer, waterLevel) {
    const { perfectRange, goodRange } = customer.evaluationTendency;

    if (waterLevel >= perfectRange[0] && waterLevel <= perfectRange[1]) {
        return {
            score: 3,
            message: customer.dialogues.reaction.perfect,
            mood: 'ecstatic'
        };
    } else if (waterLevel >= goodRange[0] && waterLevel <= goodRange[1]) {
        return {
            score: 2,
            message: customer.dialogues.reaction.good,
            mood: 'happy'
        };
    } else if (waterLevel >= goodRange[0] - 10 && waterLevel <= goodRange[1] + 10) {
        return {
            score: 1,
            message: customer.dialogues.reaction.okay,
            mood: 'neutral'
        };
    } else {
        return {
            score: 0,
            message: customer.dialogues.reaction.bad,
            mood: 'disappointed'
        };
    }
}
