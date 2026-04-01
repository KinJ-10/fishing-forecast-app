interface DatePickerBarProps {
  date: string;
  availableDates: string[];
  onDateChange: (value: string) => void;
}

export function DatePickerBar({ date, availableDates, onDateChange }: DatePickerBarProps) {
  return (
    <section className="date-bar card">
      <div>
        <p className="section-kicker">日付選択</p>
        <h2>明日の候補を比べる</h2>
        <p className="muted">
          ダミーデータでは登録済みの日付だけ表示します。将来は外部API取得に差し替え可能です。
        </p>
      </div>
      <div className="date-bar__controls">
        <input
          aria-label="予測日"
          className="date-input"
          list="forecast-dates"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />
        <datalist id="forecast-dates">
          {availableDates.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
        <div className="date-chips">
          {availableDates.map((value) => (
            <button
              key={value}
              className={value === date ? "chip chip--active" : "chip"}
              type="button"
              onClick={() => onDateChange(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
