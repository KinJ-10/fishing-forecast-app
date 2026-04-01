interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const tone =
    score >= 80 ? "score-badge score-badge--high" : score >= 70 ? "score-badge score-badge--mid" : "score-badge score-badge--low";

  return (
    <div className={tone}>
      <span>釣れやすさ</span>
      <strong>{score}</strong>
    </div>
  );
}
