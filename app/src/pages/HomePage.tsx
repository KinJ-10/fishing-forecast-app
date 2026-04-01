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
          <h2>初心者向けの判断軸</h2>
          <ul className="side-list">
            <li>スコアは直近釣果、潮、海況、季節、回遊期待、安全性を合算しています。</li>
            <li>理由は行動に移しやすい文に限定し、3件前後に絞っています。</li>
            <li>詳細画面では潮・風・最近の釣果をまとめて確認できます。</li>
          </ul>
          <div className="card-note">
            この構成なら、後からAPI取得を入れてもUIをほぼ触らず差し替えできます。
          </div>
        </aside>
      </section>
    </div>
  );
}
