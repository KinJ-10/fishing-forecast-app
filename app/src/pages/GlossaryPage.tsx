import { useGlossaryTerms } from "../hooks/useFishingForecast";

export function GlossaryPage() {
  const terms = useGlossaryTerms();

  return (
    <div className="page-grid">
      <section className="card">
        <p className="section-kicker">用語説明</p>
        <h2>初心者向けのことば辞典</h2>
        <p className="muted">
          予測に出てくる言葉を、意味と実際の行動に結びつく形で短く整理しています。
        </p>
      </section>

      <section className="glossary-grid">
        {terms.map((term) => (
          <article key={term.id} className="card glossary-card">
            <h3>{term.term}</h3>
            <p>{term.meaning}</p>
            <div className="card-note">
              <strong>初心者向けの見方:</strong> {term.beginnerTip}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
