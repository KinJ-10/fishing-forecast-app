import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="card">
      <h2>ページが見つかりません</h2>
      <p className="muted">URLが誤っているか、まだ用意していない画面です。</p>
      <Link to="/">トップへ戻る</Link>
    </section>
  );
}
