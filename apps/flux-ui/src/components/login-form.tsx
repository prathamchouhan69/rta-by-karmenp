'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: id.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message || 'Wrong id or password.');
        setBusy(false);
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Could not reach Flux. Check that the server is running and try again.');
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="About Flux">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Flux <small>by RTA · KARM</small></span>
        </div>
        <div>
          <p className="eyebrow">One operating system</p>
          <h1>Business, money, health and the work in front of you.</h1>
          <p className="login-lede">
            Flux answers with sources, shows its uncertainty and asks for human approval before any write.
            It speaks English and Hindi, works on a phone and keeps the audit trail.
          </p>
        </div>
        <ul className="login-points">
          <li><span aria-hidden="true">01</span> Verified numbers or a clear “uncertain”.</li>
          <li><span aria-hidden="true">02</span> Money, construction, health, knowledge and Jugaad in one place.</li>
          <li><span aria-hidden="true">03</span> Role-based access, approvals and a tamper-evident log.</li>
        </ul>
        <p className="login-disclaimer">
          General information only. Not medical, investment, tax or legal advice. For a possible emergency, call local emergency services.
        </p>
      </section>

      <section className="login-panel">
        <div className="card auth-card">
          <div>
            <p className="eyebrow">Secure sign in</p>
            <h2>Welcome to Flux</h2>
            <p className="muted">Use the account your Flux administrator created.</p>
          </div>
          <form onSubmit={submit} className="stack" noValidate>
            <label className="field">
              <span>User ID</span>
              <input
                className="input"
                name="id"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={id}
                onChange={(event) => setId(event.target.value)}
                required
                minLength={3}
                maxLength={40}
                placeholder="your.id"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <span className="input-with-action">
                <input
                  className="input"
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={12}
                  maxLength={1024}
                  placeholder="At least 12 characters"
                />
                <button type="button" className="ghost small" onClick={() => setShow((value) => !value)} aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            {error ? <p className="notice danger" role="alert">{error}</p> : null}
            <button className="button primary wide" type="submit" disabled={busy || !id.trim() || password.length < 12}>
              {busy ? 'Signing in…' : 'Sign in securely'}
            </button>
          </form>
          <p className="fineprint">The session is kept in an httpOnly cookie. Your password is never stored in the browser.</p>
          <p className="fineprint" lang="hi">सेशन httpOnly कुकी में रहता है। आपका पासवर्ड ब्राउज़र में कभी नहीं रखा जाता।</p>
        </div>
      </section>
    </main>
  );
}
