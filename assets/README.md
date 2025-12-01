# Assets ディレクトリ構造

このディレクトリは、ゲームで使用する画像・音声などのアセットファイルを管理します。

## ディレクトリ構成

```
assets/
├── images/          # 画像ファイル
│   ├── customers/   # 客のキャラクター画像
│   ├── equipment/   # コーヒー機器の画像
│   └── ui/          # UIアイコン・背景など
│
└── audio/           # 音声ファイル
    ├── bgm/         # BGM（背景音楽）
    └── sfx/         # SFX（効果音）
```

## 画像アセット

### customers/ - 客のキャラクター画像
- **命名規則**: `{客ID}_{表情番号}.png`
- **例**: 
  - `tanaka_0.png` - 田中の通常表情
  - `tanaka_1.png` - 田中の笑顔
  - `tanaka_2.png` - 田中の驚き顔
- **推奨サイズ**: 512x512px
- **形式**: PNG（透過対応）

### equipment/ - コーヒー機器の画像
- **内容**:
  - `grinder.png` - グラインダー本体
  - `grinder_beans.png` - コーヒー豆
  - `dripper.png` - ドリッパー
  - `cup.png` - カップ
  - `liquid.png` - 液体（グラデーション）
- **推奨サイズ**: 256x256px 〜 512x512px
- **形式**: PNG（透過対応）

### ui/ - UIアイコン・背景など
- **内容**:
  - `background.jpg` - メイン背景
  - `logo.png` - ゲームロゴ
  - `star_full.png` - 満点の星
  - `star_empty.png` - 空の星
  - `button_*.png` - ボタン素材
- **形式**: PNG/JPG

## 音声アセット

### bgm/ - BGM（背景音楽）
- **命名規則**: `{シーン名}.mp3` または `.ogg`
- **例**:
  - `menu_theme.mp3` - メニュー画面のBGM
  - `shop_ambient.mp3` - 店内の雰囲気BGM
  - `result_theme.mp3` - リザルト画面のBGM
- **形式**: MP3, OGG（ブラウザ互換性のため両方推奨）
- **推奨ビットレート**: 128kbps 〜 192kbps

### sfx/ - SFX（効果音）
- **命名規則**: `{アクション名}.mp3` または `.ogg`
- **例**:
  - `grind_loop.mp3` - グラインダーの音（ループ）
  - `pour_water.mp3` - お湯を注ぐ音
  - `button_click.mp3` - ボタンクリック音
  - `bell_ding.mp3` - 完成時のベル音
  - `door_open.mp3` - 客が来店する音
  - `door_close.mp3` - 客が退店する音
- **形式**: MP3, OGG
- **推奨サイズ**: 1秒以内の短い音

## アセットの使用方法

### AssetLoader.js での読み込み

現在の `js/AssetLoader.js` を拡張して使用：

```javascript
class AssetLoader {
    constructor() {
        this.images = {};
        this.audio = {};
    }

    async loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = path;
        });
    }

    async loadAudio(key, path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.audio[key] = audio;
                resolve(audio);
            };
            audio.onerror = reject;
            audio.src = path;
        });
    }

    // 使用例
    async loadAllAssets() {
        // 客の画像
        await this.loadImage('tanaka_0', 'assets/images/customers/tanaka_0.png');
        
        // 機器の画像
        await this.loadImage('grinder', 'assets/images/equipment/grinder.png');
        
        // BGM
        await this.loadAudio('shop_bgm', 'assets/audio/bgm/shop_ambient.mp3');
        
        // 効果音
        await this.loadAudio('grind_sfx', 'assets/audio/sfx/grind_loop.mp3');
    }
}
```

## プレースホルダー画像

実際の画像アセットが用意できるまで、以下のプレースホルダーを使用できます：

- 客: 絵文字 (😊, 😐, 😮 など)
- 機器: 絵文字 (⚙️, 🫘, ☕ など) ← 現在使用中
- UI: CSS グラデーション、単色

## 推奨ツール

### 画像制作
- **Figma** - UI/アイコンデザイン
- **GIMP** - 無料の画像編集
- **Aseprite** - ドット絵・ピクセルアート

### 音声制作
- **LMMS** / **GarageBand** - BGM制作
- **Audacity** - 音声編集（無料）
- **Freesound.org** - フリー効果音

## ライセンス

このディレクトリに配置するアセットは、以下のいずれかである必要があります：
- 自作
- フリー素材（ライセンス確認済み）
- 適切なライセンスを持つ有料素材

各素材の出典とライセンス情報は、`CREDITS.md` に記載してください。
