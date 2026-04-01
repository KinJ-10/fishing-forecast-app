# Frontend MVP Plan

## 推奨技術スタック

- Vite
- React
- TypeScript
- React Router
- プレーンCSS

## ルーティング案

- `/` トップ画面
- `/spots/:spotId?date=YYYY-MM-DD` 釣り場詳細画面
- `/glossary` 用語説明画面

## ディレクトリ構成

```text
app/
  src/
    components/        UI部品
    data/              ダミーデータとモックRepository
    domain/            型定義
    features/          スコアリングと推薦ロジック
    hooks/             画面用データ取得フック
    lib/               日付ユーティリティ
    pages/             画面単位コンポーネント
    services/          UIから使う公開サービス
```

## 設計メモ

- UIは `components` と `pages` に分離
- スコアリングは `features/scoring` の純関数に隔離
- データ取得は `ForecastRepository` インターフェース経由で差し替え可能
- 現在は `MockForecastRepository` を使い、将来はAPI実装へ置換する
