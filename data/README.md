# Customer Data 仕様書

## 概要
このドキュメントは、`data/CustomerData.js`に定義されている客データの構造と使用方法を説明します。

## データ構造

### CustomerPersonality（性格タイプ）
客の性格を表す列挙型：

- `CHEERFUL`: 明るい・社交的
- `SHY`: 内気・控えめ
- `STRICT`: 厳しい・こだわり強い
- `RELAXED`: のんびり・おおらか
- `BUSINESSLIKE`: ビジネスライク・効率的

### CoffeePreference（コーヒー好み）
客のコーヒーの好みを表す列挙型：

- `LIGHT`: 薄め好き
- `BALANCED`: バランス好き
- `STRONG`: 濃いめ好き

### Customer オブジェクト

各客は以下のプロパティを持ちます：

```javascript
{
    id: string,              // 一意識別子
    name: string,            // 表示名
    personality: string,     // 性格タイプ
    preference: string,      // コーヒー好み
    description: string,     // 説明文
    
    dialogues: {
        greeting: string[],  // 挨拶のセリフ（複数から選択）
        order: string[],     // 注文のセリフ
        reaction: {
            perfect: string, // 完璧な時の反応
            good: string,    // 良い時の反応
            okay: string,    // 普通の時の反応
            bad: string      // 悪い時の反応
        }
    },
    
    evaluationTendency: {
        perfectRange: [number, number],  // 満点を出す水位範囲
        goodRange: [number, number],     // 高評価を出す水位範囲
        tolerance: string                // 許容度 ('low'|'medium'|'high')
    },
    
    imagePath: string,       // 画像ファイルパス（将来使用）
    variants: number         // 表情バリエーション数
}
```

## 使用例

### ランダムに客を取得

```javascript
import { getRandomCustomer } from './data/CustomerData.js';

const customer = getRandomCustomer();
console.log(customer.name); // "田中"
```

### セリフをランダムに取得

```javascript
import { getRandomDialogue } from './data/CustomerData.js';

const greetingText = getRandomDialogue(customer, 'greeting');
// "おはようございます！" など
```

### 客の評価を取得

```javascript
import { evaluateCustomer } from './data/CustomerData.js';

const waterLevel = 85; // お湯の注ぎレベル
const evaluation = evaluateCustomer(customer, waterLevel);

console.log(evaluation);
// { score: 3, message: "わあ！完璧ですね！最高です！", mood: "ecstatic" }
```

## 現在定義されている客

1. **田中** - 明るい常連客（バランス好き）
2. **佐藤** - 控えめな学生（薄め好き）
3. **鈴木** - 厳しいコーヒー通（濃いめ好き）
4. **山田** - のんびり屋（バランス好き）
5. **中村** - ビジネスパーソン（濃いめ好き）

## 客の追加方法

新しい客を追加するには、`CUSTOMERS`配列に新しいオブジェクトを追加します：

```javascript
{
    id: 'watanabe',
    name: '渡辺',
    personality: CustomerPersonality.CHEERFUL,
    preference: CoffeePreference.LIGHT,
    description: '新しい客の説明',
    dialogues: { /* ... */ },
    evaluationTendency: { /* ... */ },
    imagePath: 'assets/customers/watanabe.png',
    variants: 3
}
```

## GameStoreとの統合

`GameStore.js`の`nextCustomer()`メソッドを以下のように修正して使用：

```javascript
import { getRandomCustomer, getRandomDialogue, evaluateCustomer } from './data/CustomerData.js';

nextCustomer() {
    // 客データを取得
    const customerData = getRandomCustomer();
    
    this.currentCustomer = {
        ...customerData,
        variant: Math.floor(Math.random() * customerData.variants)
    };
    
    // セリフを設定
    this.greetingText = getRandomDialogue(customerData, 'greeting');
    this.orderText = getRandomDialogue(customerData, 'order');
}

evaluateBrew() {
    const { waterLevel } = this.brewData;
    return evaluateCustomer(this.currentCustomer, waterLevel);
}
```
