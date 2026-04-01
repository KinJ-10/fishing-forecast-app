import { DatePickerBar } from "../components/DatePickerBar";
import { SpotRankingCard } from "../components/SpotRankingCard";
import { useDailyRecommendations } from "../hooks/useFishingForecast";

export function HomePage() {
  const { date, availableDates, recommendations, loading, setDate } = useDailyRecommendations();

  return (
    <div className="page-grid">
      <DatePickerBar date={date} availableDates={availableDates} onDateChange={setDate} />

      <section className="ranking-layout">
        <div className="ranking-column">
          {loading ? (
            <div className="card">読み込み中です。</div>
          ) : (
            recommendations.map((recommendation) => (
              <SpotRankingCard
                key={`${recommendation.spot.id}-${recommendation.forecast.date}`}
                recommendation={recommendation}
              />
            ))
          )}
        </div>

        <aside className="card side-panel">
          <p className="section-kicker">見方</p>
          <h2>はじめてでも迷いにくい見方</h2>
          <ul className="side-list">
            <li>スコアは最近の様子、海の動き、風と波、季節、近くの釣り場の様子を合わせて出しています。</li>
            <li>理由は「だから行く」だけでなく、「どう動くとよいか」まで短く添えています。</li>
            <li>情報が少ない地点では、近くの釣り場や季節の傾向を使って極端な評価にならないようにしています。</li>
          </ul>
          <div className="card-note">
            実データに切り替えるときも、取得元は Repository 差し替えで吸収できる構成です。
          </div>
        </aside>
      </section>
    </div>
  );
}
