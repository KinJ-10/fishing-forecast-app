# Data Acquisition And Normalization Design

## データソース責務表

| 項目 | 想定ソース | 取得粒度 | 更新頻度 | 信頼度 | 欠損しやすさ | 実装難易度 | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 施設基本情報 | 横浜市「横浜フィッシングピアーズ」, 川崎市「東扇島西公園 釣り施設」 | 施設単位 | 低頻度 | 高 | 低 | 低 | 施設名、住所、営業時間、アクセスの土台。まずは手動同期でもよい。 |
| 施設ルール | 大黒/本牧は横浜市と公式施設ページ, 東扇島は川崎市公式ページ | 施設単位 | 低頻度 | 高 | 低 | 低 | ルールは変化が少ないのでキャッシュ長め。 |
| 直近釣果 | 大黒/本牧は公式施設サイト優先, 3地点共通fallbackはアングラーズ | 施設単位 + 投稿単位 | 日次〜随時 | 公式は高, コミュニティは中 | 中〜高 | 中〜高 | 東扇島はコミュニティ依存になりやすい。 |
| 潮位・満潮干潮 | 気象庁 潮位表 | 観測点 + 日単位 | 日次, 先読みあり | 高 | 低 | 低 | 横浜/本牧/川崎/京浜港を spot に割り当てる。 |
| 風 | Open-Meteo Weather API, 補助に気象庁地域時系列予報 | 座標 + 時間単位 | APIは時間単位, JMAは1日3回 | 中 | 低 | 低〜中 | 実装しやすさを優先するなら Open-Meteo が本命。 |
| 波 | Open-Meteo Marine API | 座標 + 時間単位 | 時間単位, モデル更新は6〜24時間 | 中 | 中 | 低〜中 | 沿岸精度に限界があるため、UIでは推定値と扱う。 |
| 海面水温 | Open-Meteo Marine API, 補助に気象庁海面水温 | 座標 + 時間単位 / 海域単位 | 時間単位 / JMAは週次寄り | 中 | 中 | 中 | 点の即時性は Open-Meteo、広域トレンド確認は JMA。 |

## 取得仕様メモ

- 施設基本情報と施設ルールは「静的データ」として扱い、更新は長めの TTL または手動更新でよい。
- 釣果、風、波、水温は「変動データ」として扱い、日付・時刻つきの Raw 保存を前提にする。
- UI に渡す時点では取得元差異を見せず、`DailySpotForecast` に集約する。
- 気象庁の潮位表は、固定カラムのテキストデータ版を優先し、HTML 版は fallback とする。
- 気象庁の潮位表 HTML / TXT は `Access-Control-Allow-Origin` を返していないため、browser 直 fetch は CORS で失敗しやすい。
- ブラウザ版 MVP の real tide 検証は dev proxy で行い、本番運用では server-side fetch / BFF を前提にする。

## Raw / Normalized / UI の3層モデル

### 1. Raw データ

- 外部ソースから取得したままの文字列や JSON
- 例:
  - `RawCatchSourceRecord`
  - `RawTideSourceRecord`
  - `RawWeatherSourceRecord`
  - `RawWaveSourceRecord`
  - `RawWaterTemperatureSourceRecord`
  - `RawFacilitySourceRecord`
- 役割:
  - 取得元固有の構造を保持
  - 再正規化できるように元表現を落とさない

### 2. 正規化後データ

- spot 単位・日付単位で比較しやすい形へ変換したデータ
- 例:
  - `NormalizedCatchRecord`
  - `NormalizedTideRecord`
  - `NormalizedMarineRecord`
  - `NormalizedFacilityRecord`
- 役割:
  - 名寄せ後の `spotId` を持つ
  - 数値化、時刻整形、単位整形を行う
  - 欠損や信頼度を付与する

### 3. UI に渡す最終データ

- 現行の `DailySpotForecast`, `Spot`, `Recommendation`
- 役割:
  - 理由文、注意文、魚候補など UI 表現に寄せた形へ組み立てる
  - fallback 事情は `fallbackNotes` と `sourceStatus` に閉じ込める

## Spot ごとの正規 ID と外部ソース名寄せルール

### 正規 ID

- `daikoku`
- `honmoku`
- `higashi-ogishima`

### 名寄せの基本ルール

1. Canonical name を `spotId` に1対1で固定する
2. 外部名称は `NFKC` 正規化し、小文字化し、空白・記号を除去する
3. `海釣り` と `海づり` は同一扱いに寄せる
4. 名前だけで一致しない場合はヒント文字列で補う
5. 同名候補が複数ある場合は source 固有の alias table を優先する

### 施設別 alias 例

- `daikoku`
  - `大黒海づり施設`
  - `大黒海釣り施設`
  - `大黒`
  - `DAIKOKU`
- `honmoku`
  - `本牧海づり施設`
  - `本牧海釣り施設`
  - `本牧`
  - `HONMOKU`
- `higashi-ogishima`
  - `東扇島西公園`
  - `東扇島西公園 釣り施設`
  - `西公園`
  - `東扇島`

### 同一施設判定方法

- 第1段階: source 固有 alias 完全一致
- 第2段階: 正規化後トークン一致
- 第3段階: 住所・ドメイン・地名など `matchingHints` で補強
- 第4段階: 未確定時は自動一致させず review 対象に残す

## 欠損時優先順位表

| 欠損ケース | 代替に使うもの | スコア影響 | UI 表示 |
| --- | --- | --- | --- |
| 直近釣果が無い | 近隣スポット釣果 → 季節適合 → 中立点 | 直近釣果は中立〜控えめ加点 | 「この地点だけでは新しい釣果が少ないため、近くの釣り場の様子も合わせて見ています」 |
| 潮データが無い | 近接観測点の潮位表 → その日を非推奨扱いにせず中立点 | 潮スコアは中立寄り | 「潮の詳しい時刻が取れないため、時間のおすすめは控えめにしています」 |
| 風波が部分欠損 | 取れた要素だけ使い、欠けた要素は安全側の仮点 | 海況スコアは控えめ、安全性減点はやや強め | `未取得` を明示し、「無理をしない前提で見ています」 |
| 水温が取れない | 季節適合のみ使用、近海 SST は補助指標 | 季節スコアは維持、水温加点は無効 | 「水温データは未取得ですが、季節の合いやすさで見ています」 |

## RealForecastRepository interface 改善案

### 方針

- mock と real は同じ `ForecastRepository` を実装する
- Repository は `RepositoryResult<T>` を返し、`data` 以外に `partial` と `reports` を持つ
- UI は `forecastService` が unwrap するので取得元差異を意識しない

### source metadata

- `SourceCatalogEntry`
- `SourceFetchReport`
- `SourceFetchIssue`
- `RepositoryMeta`

### キャッシュ前提

- query に `cachePolicy`, `allowPartial`, `maxStalenessMinutes` を持たせる
- Repository 実装内で source ごとの TTL を判断する
- `reports.cacheStatus` で `hit / miss / stale / bypass` を保持する

### 失敗時の戻り値方針

- 原則 throw ではなく `RepositoryResult` で partial を返す
- 完全に空で続行不能な場合のみ例外
- 1 source 失敗は `reports[].state = failed` と `issues` へ記録し、使える source だけで続行

## ディレクトリ構成案

```text
app/src/
  data/
    repositories/          mock / real repository 実装
  data-sources/            source client と raw fetcher
  normalizers/             raw -> normalized 変換
  cache/                   cache key / TTL / store
  source-mappers/          spot / station / species の名寄せ
  domain/
    models.ts              UI 向け最終モデル
    sourceIntegration.ts   raw / normalized / source metadata
  services/
    forecastService.ts     UI から使う facade
```

## 参考ソース

- 横浜市 横浜フィッシングピアーズ: https://www.city.yokohama.lg.jp/kanko-bunka/minato/taikan/asobu/spot/umizuri.html
- 川崎市 東扇島西公園 釣り施設: https://www.city.kawasaki.jp/580/page/0000001598.html
- 川崎市 浮島つり園: https://www.city.kawasaki.jp/580/page/0000001640.html
- 気象庁 潮位表 横浜: https://ds.data.jma.go.jp/gmd/kaiyou/db/tide/suisan/suisan.php?stn=QS
- 気象庁 地域時系列予報カタログ: https://www.data.jma.go.jp/suishin/cgi-bin/catalogue/make_product_page.cgi?id=Jikeiret
- 気象庁 日本近海の海面水温: https://ds.data.jma.go.jp/kaiyou/data/shindan/c_1/jpn_jun/jpn_sst.html
- Open-Meteo Marine API: https://open-meteo.com/en/docs/marine-weather-api
- アングラーズ: https://anglers.jp/
