import Link from 'next/link';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <main className="centered-page">
      <div className="auth-brand">
        <span className="brand-mark" aria-hidden="true">F</span>
        <span>Flux</span>
      </div>
      <div className="card auth-card">
        <h1>You are offline</h1>
        <p className="muted">This page needs a connection. Messages you queue in Ask Flux will be kept and sent when you reconnect.</p>
        <p className="muted" lang="hi">यह पेज खुलने के लिए कनेक्शन चाहिए। फ्लक्स से पूछें में कतारबद्ध संदेश कनेक्शन आने पर भेजे जाएँगे।</p>
        <Link className="button primary" href="/">Try again</Link>
      </div>
    </main>
  );
}
