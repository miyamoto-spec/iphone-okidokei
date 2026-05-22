# 置時計 (iPhone PWA)

iPhone を縦置きの置時計として使う PWA。GitHub Pages で配信し、Safari の「ホーム画面に追加」でフルスクリーン起動。

## 機能

- **時計** — `HH:MM`（コロンがフェード点滅）
- **時間別天気** — 6 時間分 / 3×2 グリッド（アイコン・気温・降水確率）
- **週間天気** — 8 日分 / 4×2 グリッド（アイコン・最高/最低）
- **ニュース** — NHK RSS のテロップ（横スクロール 1 行）
- **夜間減光** — 22:00–6:00 自動で減光オーバーレイ
- **画面回転** — 加速度センサーで 180° 自動反転（iOS は要許可）
- **オフライン** — Service Worker で静的アセットをキャッシュ

## 技術

| 項目 | 採用 |
|:---|:---|
| フロントエンド | HTML + CSS + Vanilla JS |
| 天気 API | [Open-Meteo](https://open-meteo.com)（無料・キー不要） |
| ニュース | NHK 主要 RSS → [rss2json](https://rss2json.com) |
| ホスティング | GitHub Pages |

## ローカル開発

```sh
npx serve . -l 5173
# http://localhost:5173 を開く
```

`localhost` では Service Worker は登録されないので、CSS/JS の更新がそのまま反映される。

## デプロイ

GitHub Pages を有効化すると `https://<user>.github.io/<repo>/` で配信される。Safari でアクセスし「共有 → ホーム画面に追加」でインストール。

## ファイル

```
├── index.html        # PWA メタ + セマンティック構造
├── styles.css        # OLED 黒 × アンバー
├── app.js            # 時計・天気・ニュース・モーション
├── manifest.json     # PWA 設定
├── sw.js             # Service Worker
└── icons/
    ├── icon-192.png
    └── icon-512.png
```
