export const today = new Date("2026-04-01T09:00:00+09:00");

export function getTomorrowDateString(): string {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string): string {
  const date = new Date(`${value}T09:00:00+09:00`);

  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function getSeasonLabel(dateString: string): string {
  const month = new Date(`${dateString}T09:00:00+09:00`).getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return "spring";
  }
  if (month >= 6 && month <= 8) {
    return "summer";
  }
  if (month >= 9 && month <= 11) {
    return "autumn";
  }
  return "winter";
}
