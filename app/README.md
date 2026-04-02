# App Local Setup

## Repository Mode

- `VITE_FORECAST_REPOSITORY_MODE=mock`
  - 既定値です。すべてダミーデータで動きます。
- `VITE_FORECAST_REPOSITORY_MODE=real`
  - `tide` の実データ経路を有効にします。現時点では未実装項目は mock を併用します。
- `VITE_FORECAST_REPOSITORY_MODE=hybrid`
  - `tide` のみ real、その他は mock の確認用モードです。

現時点では `real` と `hybrid` の挙動差は小さく、どちらも `tide` の source report 確認が主目的です。

## Local Run

### Mock

```bash
cd app
npm install
npm run dev
```

### Real Tide

```bash
cd app
VITE_FORECAST_REPOSITORY_MODE=real npm run dev
```

補足:
- `npm run dev` では `JMA Tide Table` を既定で Vite proxy 経由に切り替えます。
- 取得経路は `テキストデータ版優先 / HTML版 fallback` です。
- `VITE_JMA_TIDE_FETCH_MODE=direct` を付けると browser 直 fetch を再現できます。JMA 側レスポンスに CORS 許可ヘッダがないため、通常は `Failed to fetch` になります。

### Hybrid

```bash
cd app
VITE_FORECAST_REPOSITORY_MODE=hybrid npm run dev
```

### Fetch Mode

- `VITE_JMA_TIDE_FETCH_MODE=auto`
  - 既定値です。dev では proxy、その他では direct を使います。
- `VITE_JMA_TIDE_FETCH_MODE=proxy`
  - 常に Vite proxy 経由で取得します。ローカル検証向けです。
- `VITE_JMA_TIDE_FETCH_MODE=direct`
  - 常に browser 直 fetch を使います。CORS failure の再現確認向けです。

## What To Check

- トップ画面の最下部に `Debug / Repository / Source Reports` が出ること
- `mode` が `real` または `hybrid` になっていること
- `JMA Tide Table` の `status`, `fetchedAt`, `summary` が見えること
- success 時は `summary` に `parserRecords=<件数>` が出ること
- fetch に失敗した場合でも画面が壊れず、`partial: yes` と failure report が見えること
- failure 時は `issues` に `JMA_TIDE_REQUEST_ROUTE`, `JMA_TIDE_SOURCE_URL`, `JMA_TIDE_BROWSER_CORS_LIKELY` などの code つき診断が出ること
- parser fallback 時は `JMA_TIDE_TEXT_FALLBACK_HTML` が出ること

## Local Debug Steps

1. `cd app`
2. `VITE_FORECAST_REPOSITORY_MODE=real npm run dev`
3. Debug panel で `JMA Tide Table` が `成功` になり、`summary` に `parserRecords=1` 以上が出ることを確認する
4. `VITE_FORECAST_REPOSITORY_MODE=real VITE_JMA_TIDE_FETCH_MODE=direct npm run dev`
5. Debug panel で `失敗` と `JMA_TIDE_BROWSER_CORS_LIKELY` が出ることを確認する

## Current Limitation

- 静的な browser アプリが JMA の HTML を直接 fetch する構成は、CORS 制約のため安定運用できません。
- ローカル開発では Vite proxy で回避できますが、本番で real tide source を使うには server-side fetch または BFF が必要です。
