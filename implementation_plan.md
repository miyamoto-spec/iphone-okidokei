# iPhone 置時計アプリ（PWA）

iPhoneを縦置きの置時計として使うPWA。GitHub Pagesにデプロイし、iPhoneのSafariからアクセスして「ホーム画面に追加」でインストール。

---

## インストール手順（完成後）

```
1. GitHub Pagesにデプロイ → https://ユーザー名.github.io/リポジトリ名/
2. iPhoneのSafariでURLを開く（QRコードも用意）
3. 共有ボタン（□↑）→「ホーム画面に追加」→「追加」
4. ホーム画面のアイコンをタップで起動！
```

---

## 設計概要

### 技術スタック
| 項目 | 選定 | 理由 |
|:---|:---|:---|
| フロントエンド | HTML + CSS + Vanilla JS | 軽量、依存なし |
| 天気API | [Open-Meteo](https://open-meteo.com) | 無料、APIキー不要 |
| ニュース | NHK RSS → rss2json.com | 無料、日本語 |
| ホスティング | **GitHub Pages** | 無料、HTTPS対応（PWA必須） |

### 画面レイアウト

```
┌─────────────────────────┐
│    5月22日(木)           │  ← 日付
│     16:27               │  ← 時刻（超大文字、横幅いっぱい）
├─────────────────────────┤
│ ☀️25° │ ☁️23° │ 🌧21°   │  ← 6時間後まで1時間ごと
│ 17時  │ 18時  │ 19時   │
│ ☀️20° │ 🌧19° │ ☁️22°   │
│ 20時  │ 21時  │ 22時   │
├─────────────────────────┤
│ 月☀️24 火☁️22 水🌧20 ...│  ← 週間天気
├─────────────────────────┤
│ ▶ ニュースが自動スクロール │  ← テロップ式ニュース
└─────────────────────────┘
※ コネクタ上下どちらでも自動回転
```

### バッテリー保護
- OLED純黒テーマ（`#000`背景でピクセルOFF）
- 夜間自動減光（22:00〜6:00）
- 設定で「80%充電制限」推奨表示

---

## Proposed Changes

### ファイル構成
```
iphone_時計アプリ_IDE/
├── index.html        # メインHTML + PWA設定
├── styles.css        # 全スタイル（OLED Dark）
├── app.js            # アプリロジック全体
├── manifest.json     # PWAマニフェスト
└── sw.js             # Service Worker（オフライン対応）
```

---

#### [NEW] [index.html](file:///c:/Users/miyamoto/Desktop/Antigravity/iphone_時計アプリ_IDE/index.html)
- PWA metaタグ、Google Fonts、セマンティック構造
- 初回インストールガイドオーバーレイ
- モーションセンサー許可ボタン

#### [NEW] [styles.css](file:///c:/Users/miyamoto/Desktop/Antigravity/iphone_時計アプリ_IDE/styles.css)
- OLED黒テーマ、`vw`/`clamp()`の超大文字時計
- 天気Grid、ニュース自動スクロール、夜間オーバーレイ

#### [NEW] [app.js](file:///c:/Users/miyamoto/Desktop/Antigravity/iphone_時計アプリ_IDE/app.js)
- 時計（毎秒更新）、天気（Open-Meteo、30分更新）、ニュース（RSS、10分更新）
- 加速度センサーで180°回転検知、インストールガイド、夜間減光

#### [NEW] [manifest.json](file:///c:/Users/miyamoto/Desktop/Antigravity/iphone_時計アプリ_IDE/manifest.json)
- PWA設定（standalone, portrait, #000テーマ）

#### [NEW] [sw.js](file:///c:/Users/miyamoto/Desktop/Antigravity/iphone_時計アプリ_IDE/sw.js)
- 静的アセットキャッシュ、オフライン対応

---

## デプロイ手順

1. ワークスペースで `git init` → GitHubにリポジトリ作成・push
2. GitHub Settings → Pages → Source: main branch
3. 数分後に `https://ユーザー名.github.io/リポジトリ名/` で公開

---

## Verification Plan
1. ローカル `npx serve .` で動作確認
2. 時計・天気・ニュースの各機能確認
3. 画面回転の動作確認
4. GitHub Pagesデプロイ後の最終確認
