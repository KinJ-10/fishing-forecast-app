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
          <span className="pill">狙い魚: {recommendation.forecast.targetSpecies.join(" / ")}</span>
          <span className="pill">おすすめ時間: {recommendation.forecast.recommendedWindows.join(" / ")}</span>
        </div>

        <ReasonList reasons={recommendation.reasons} />
        <div className="card-note">
          <strong>注意事項:</strong> {recommendation.caution}
        </div>
      </section>

      <section className="detail-columns">
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
              <dd>{recommendation.forecast.tide.activeWindows.join(" / ")}</dd>
            </div>
          </dl>
          <p className="muted">{recommendation.forecast.tide.comment}</p>
        </article>

        <article className="card">
          <p className="section-kicker">波・風・水温</p>
          <dl className="info-grid">
            <div>
              <dt>天気</dt>
              <dd>{recommendation.forecast.weather.sky}</dd>
            </div>
            <div>
              <dt>風速</dt>
              <dd>{recommendation.forecast.weather.windSpeedMps} m/s</dd>
            </div>
            <div>
              <dt>波高</dt>
              <dd>{recommendation.forecast.weather.waveHeightM} m</dd>
            </div>
            <div>
              <dt>水温</dt>
              <dd>{recommendation.forecast.weather.waterTempC} ℃</dd>
            </div>
          </dl>
          <p className="muted">{spot.safetyNote}</p>
        </article>

        <article className="card">
          <p className="section-kicker">最近の釣果</p>
          <ul className="data-list">
            {recommendation.forecast.recentCatches.map((catchItem) => (
              <li key={catchItem.species}>
                <strong>{catchItem.species}</strong>
                <span>{catchItem.latestCount}件相当 / {catchItem.note}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <p className="section-kicker">回遊期待度</p>
          <ul className="data-list">
            {recommendation.forecast.migrationSignals.map((signal) => (
              <li key={signal.species}>
                <strong>
                  {signal.species} / {signal.confidence === "high" ? "高" : signal.confidence === "medium" ? "中" : "低"}
                </strong>
                <span>{signal.note}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <p className="section-kicker">施設ルール</p>
          <ul className="side-list">
            {spot.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="muted">{spot.accessNote}</p>
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
        </article>
      </section>
    </div>
  );
}
