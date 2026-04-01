import { Link, NavLink, Outlet } from "react-router-dom";

export function Shell() {
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Kawasaki to Yokohama Bay Forecast</p>
          <Link className="hero__title-link" to="/">
            <h1>釣り予測ブラウザアプリ</h1>
          </Link>
          <p className="hero__copy">
            明日どこへ行くか、何が釣れそうか、何時が狙い目かを初心者向けの理由つきで整理します。
          </p>
          <nav className="hero__nav">
            <NavLink to="/">トップ</NavLink>
            <NavLink to="/glossary">用語説明</NavLink>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
