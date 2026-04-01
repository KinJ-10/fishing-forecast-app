import { Link, useParams, useSearchParams } from "react-router-dom";
import { ReasonList } from "../components/ReasonList";
import { ScoreBadge } from "../components/ScoreBadge";
import { SpotId } from "../domain/models";
import { useSpotRecommendation } from "../hooks/useFishingForecast";
import { formatDisplayDate } from "../lib/date";

const validSpotIds: SpotId[] = ["daikoku", "honmoku", "higashi-ogishima"];

export function SpotDetailPage() {
  const { spotId } = useParams();
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date") ?? "2026-04-02";

  if (!spotId || !validSpotIds.includes(spotId as SpotId)) {
    return (
      <section className="card">
        <h2>釣り場が見つかりません</h2>
        <Link to="/">トップへ戻る</Link>
      </section>
    );
  }

  const { loading, spot, recommendation } = useSpotRecommendation(spotId as SpotId, date);

  if (loading) {
    return <section className="card">読み込み中です。</section>;
  }

  if (!spot || !recommendation) {
    return (
      <section className="card">
        <h2>この日のデータがありません</h2>
        <p className="muted">ダミーデータにない日付か、対象外の釣り場です。</p>
        <Link to="/">トップへ戻る</Link>
      </section>
    );
  }

  return (
    <div className="page-grid detail-grid">
      <section className="card detail-hero">
        <div className="detail-hero__heading">
          <div>
            <p className="section-kicker">{formatDisplayDate(recommendation.forecast.date)}</p>
            <h2>{spot.name}</h2>
            <p className="muted">{spot.summary}</p>
          </div>
          <ScoreBadge score={recommendation.score} />
        </div>

        <div className="pill-row">
          <span className="pill">
            初心者向け度: {spot.beginnerLevel === "high" ? "高い" : "やや慣れが必要"}
          </span>
          <span className="pill">
            狙い魚: {recommendation.forecast.targetSpecies.map((species) => species.name).join(" / ")}
          </span>
          <span className="pill">
            おすすめ時間: {recommendation.forecast.recommendedTimeSlots.join(" / ")}
          </span>
        </div>

        <ReasonList reasons={recommendation.reasons} />
        <div className="card-note">
          <strong>{recommendation.primaryAdvisory.title}:</strong> {recommendation.primaryAdvisory.summary}
          <br />
          {recommendation.primaryAdvisory.actionTip}
        </div>
      </section>

      <section className="detail-columns">
        <article className="card">
          <p className="section-kicker">狙いやすい魚</p>
          <ul className="data-list">
            {recommendation.forecast.targetSpecies.map((species) => (
              <li key={species.name}>
                <strong>
                  {species.name} / {species.likelihood === "high" ? "本命" : species.likelihood === "medium" ? "候補" : "チャンス待ち"}
                </strong>
                <span>{species.comment}</span>
                <span>おすすめの始め方: {species.recommendedMethod}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <p className="section-kicker">潮情報</p>
          <h3>{recommendation.forecast.tide.tideName}</h3>
          <dl className="info-grid">
            <div>
              <dt>満潮</dt>
              <dd>{recommendation.forecast.tide.highTide}</dd>
            </div>
            <div>
              <dt>干潮</dt>
              <dd>{recommendation.forecast.tide.lowTide}</dd>
            </div>
            <div>
              <dt>動く時間</dt>
              <dd>{recommendation.forecast.tide.movementWindows.map((window) => window.label).join(" / ")}</dd>
            </div>
          </dl>
          <p className="muted">{recommendation.forecast.tide.summary}</p>
        </article>

        <article className="card">
          <p className="section-kicker">波・風・水温</p>
          <dl className="info-grid">
            <div>
              <dt>天気</dt>
              <dd>{recommendation.forecast.marine.sky}</dd>
            </div>
            <div>
              <dt>風速</dt>
              <dd>
                {recommendation.forecast.marine.windSpeedMps === null
                  ? "未取得"
                  : `${recommendation.forecast.marine.windSpeedMps} m/s`}
              </dd>
            </div>
            <div>
              <dt>波高</dt>
              <dd>
                {recommendation.forecast.marine.waveHeightM === null
                  ? "未取得"
                  : `${recommendation.forecast.marine.waveHeightM} m`}
              </dd>
            </div>
            <div>
              <dt>水温</dt>
              <dd>
                {recommendation.forecast.marine.waterTempC === null
                  ? "未取得"
                  : `${recommendation.forecast.marine.waterTempC} ℃`}
              </dd>
            </div>
          </dl>
          <p className="muted">{recommendation.forecast.marine.summary}</p>
          <p className="muted">{recommendation.forecast.marine.beginnerComment}</p>
        </article>

        <article className="card">
          <p className="section-kicker">最近の様子</p>
          <p className="muted">{recommendation.forecast.catchSummary.summary}</p>
          <ul className="data-list">
            {recommendation.forecast.catchSummary.observations.map((catchItem) => (
              <li key={`${catchItem.species}-${catchItem.countLabel}`}>
                <strong>{catchItem.species}</strong>
                <span>{catchItem.countLabel}</span>
                <span>{catchItem.summary}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <p className="section-kicker">回遊期待度</p>
          <p>
            <strong>
              {recommendation.forecast.migration.level === "high"
                ? "高め"
                : recommendation.forecast.migration.level === "medium"
                  ? "ふつう"
                  : "控えめ"}
            </strong>
          </p>
          <p>{recommendation.forecast.migration.summary}</p>
          <p className="muted">参考にした近くの釣り場: {recommendation.forecast.migration.nearbySpots.join(" / ")}</p>
          <p className="muted">動き方: {recommendation.forecast.migration.actionTip}</p>
        </article>

        <article className="card">
          <p className="section-kicker">施設ルール</p>
          <ul className="side-list">
            {spot.facilityRules.map((rule) => (
              <li key={rule.id}>
                <strong>{rule.title}</strong>
                <br />
                {rule.description}
              </li>
            ))}
          </ul>
          <p className="muted">{spot.accessNote}</p>
          <p className="muted">{spot.safetyNote}</p>
        </article>

        <article className="card">
          <p className="section-kicker">スコア内訳</p>
          <dl className="info-grid">
            <div>
              <dt>直近釣果</dt>
              <dd>{recommendation.breakdown.recentCatch}</dd>
            </div>
            <div>
              <dt>潮</dt>
              <dd>{recommendation.breakdown.tide}</dd>
            </div>
            <div>
              <dt>海況</dt>
              <dd>{recommendation.breakdown.marine}</dd>
            </div>
            <div>
              <dt>季節適合</dt>
              <dd>{recommendation.breakdown.seasonal}</dd>
            </div>
            <div>
              <dt>回遊期待</dt>
              <dd>{recommendation.breakdown.migration}</dd>
            </div>
            <div>
              <dt>安全性減点</dt>
              <dd>-{recommendation.breakdown.safetyPenalty}</dd>
            </div>
          </dl>
          {recommendation.breakdown.fallbackNotes.length > 0 ? (
            <div className="card-note">
              <strong>情報が少ないときの扱い:</strong>
              <ul className="side-list">
                {recommendation.breakdown.fallbackNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <article className="card">
          <p className="section-kicker">行く前に気をつけること</p>
          <ul className="data-list">
            {recommendation.forecast.advisories.map((advisory) => (
              <li key={advisory.id}>
                <strong>{advisory.title}</strong>
                <span>{advisory.summary}</span>
                <span>動き方: {advisory.actionTip}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
