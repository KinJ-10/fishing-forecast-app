import { Link } from "react-router-dom";
import { Recommendation } from "../domain/models";
import { formatDisplayDate } from "../lib/date";
import { ReasonList } from "./ReasonList";
import { ScoreBadge } from "./ScoreBadge";

interface SpotRankingCardProps {
  recommendation: Recommendation;
}

export function SpotRankingCard({ recommendation }: SpotRankingCardProps) {
  return (
    <article className="card ranking-card">
      <div className="ranking-card__header">
        <div>
          <p className="section-kicker">おすすめ {recommendation.rank}位</p>
          <h3>{recommendation.spot.name}</h3>
          <p className="muted">
            {formatDisplayDate(recommendation.forecast.date)} / {recommendation.spot.area}
          </p>
        </div>
        <ScoreBadge score={recommendation.score} />
      </div>

      <div className="pill-row">
        <span className="pill">狙い魚: {recommendation.forecast.targetSpecies.join(" / ")}</span>
        <span className="pill">狙い目: {recommendation.forecast.recommendedWindows.join(" / ")}</span>
      </div>

      <ReasonList reasons={recommendation.reasons} />

      <div className="card-note">
        <strong>注意:</strong> {recommendation.caution}
      </div>

      <div className="card-actions">
        <Link to={`/spots/${recommendation.spot.id}?date=${recommendation.forecast.date}`}>
          詳細を見る
        </Link>
      </div>
    </article>
  );
}
