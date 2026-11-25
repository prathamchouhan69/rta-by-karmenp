import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Palette,
  Signal,
  Sparkles,
  Waves,
} from 'lucide-react';
import { useAuth } from '../auth';
import { useRouter } from '../router';
import { useApp } from '../../context/AppContext';
import { cx } from '../format';

export const LoginScreen: React.FC = () => {
  const { login, enterDemo, error, busy, clearError, status } = useAuth();
  const { navigate } = useRouter();
  const { themeMode, setThemeMode } = useApp();
  const studio = themeMode === 'studio' || themeMode === 'day';
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') navigate('today');
  }, [status, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      return;
    }
    try {
      await login(code.trim());
      navigate('today');
    } catch {
      /* error is surfaced by the auth context */
    }
  };

  const setTheme = (mode: 'signal' | 'studio') => {
    setThemeMode(mode);
  };

  return (
    <div
      className={cx(
        'relative min-h-screen w-full overflow-hidden',
        studio ? 'bg-[#eee8f5] text-[#221a2e]' : 'bg-[#07070b] text-[#f6f3ec]',
      )}
      data-login-theme={studio ? 'studio' : 'signal'}
    >
      {/* atmospheric field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="k-orb left-[-12%] top-[-16%] h-[540px] w-[540px]"
          style={{ background: studio ? 'rgba(109,74,255,0.20)' : 'rgba(34,211,238,0.16)' }}
        />
        <div
          className="k-orb right-[22%] top-[24%] h-[420px] w-[420px]"
          style={{ background: studio ? 'rgba(243,234,217,0.55)' : 'rgba(167,139,250,0.14)' }}
        />
        <div
          className="k-orb bottom-[-20%] left-[24%] h-[520px] w-[520px]"
          style={{ background: studio ? 'rgba(14,116,144,0.10)' : 'rgba(251,191,104,0.05)' }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[76vw] max-h-[1100px] w-[76vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-40"
          style={{ borderColor: studio ? 'rgba(109,74,255,0.18)' : 'rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[56vw] max-h-[820px] w-[56vw] max-w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-30"
          style={{ borderColor: studio ? 'rgba(109,74,255,0.16)' : 'rgba(34,211,238,0.10)' }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[38vw] max-h-[560px] w-[38vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-30"
          style={{ borderColor: studio ? 'rgba(109,74,255,0.14)' : 'rgba(255,255,255,0.05)' }}
        />
        <div className="k-scanline" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1680px] flex-col">
        {/* top bar */}
        <header className="flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <div className="flex items-center gap-3">
            <div
              className={cx(
                'flex h-10 w-10 items-center justify-center rounded-[13px] border',
                studio
                  ? 'border-[#2b1c44]/15 bg-[#241a33]'
                  : 'border-white/10 bg-white/[0.04]',
              )}
            >
              <img src="/karm-symbol-white.png" alt="RTA by KARM" className="h-7 w-7 object-contain" />
            </div>
            <div className="leading-none">
              <div className={cx('text-[15px] font-extrabold tracking-[-0.05em]', studio ? 'text-[#241a33]' : 'text-[#f6f3ec]')}>
                RTA <span className="font-medium opacity-60">by</span> KARM
              </div>
              <div className={cx('mt-1 k-mono text-[8px] uppercase tracking-[0.24em]', studio ? 'text-[#6d4aff]' : 'text-[#22d3ee]')}>
                living business OS
              </div>
            </div>
          </div>

          <div className={cx('flex items-center gap-1 rounded-full border p-1', studio ? 'border-[#2b1c44]/10 bg-white/50' : 'border-white/10 bg-white/[0.03]')}>
            <button
              onClick={() => setTheme('signal')}
              className={cx(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all',
                !studio ? 'bg-[#22d3ee] text-[#041014]' : 'text-[#6a5f7d] hover:text-[#241a33]',
              )}
            >
              <Signal size={12} />
              Signal
            </button>
            <button
              onClick={() => setTheme('studio')}
              className={cx(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all',
                studio ? 'bg-[#6d4aff] text-white' : 'text-[#8c8997] hover:text-[#f6f3ec]',
              )}
            >
              <Palette size={12} />
              Studio
            </button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
          {/* Editorial panel */}
          <section className="relative flex flex-col justify-between px-5 pb-8 pt-2 md:px-10 lg:px-14 lg:pb-12 lg:pt-6">
            <div className="max-w-[760px]">
              <div className="flex items-center gap-2">
                <span className={cx('h-px w-8', studio ? 'bg-[#6d4aff]' : 'bg-[#22d3ee]')} />
                <span className={cx('k-mono text-[9px] uppercase tracking-[0.26em]', studio ? 'text-[#6d4aff]' : 'text-[#22d3ee]')}>
                  {studio ? 'A living universe of work' : 'A living business operating system'}
                </span>
              </div>

              {studio ? (
                <h1 className="k-serif mt-7 text-[54px] leading-[0.9] tracking-[-0.045em] text-[#241a33] sm:text-[74px] lg:text-[92px]">
                  Work, as
                  <br />
                  a living
                  <br />
                  <span className="italic text-[#6d4aff]">universe.</span>
                </h1>
              ) : (
                <h1 className="k-display mt-7 text-[44px] leading-[0.94] text-[#f6f3ec] sm:text-[66px] lg:text-[82px]">
                  See the signal.
                  <br />
                  Make the decision.
                  <br />
                  <span className="text-[#22d3ee]">Move the work.</span>
                </h1>
              )}

              <p
                className={cx(
                  'mt-7 max-w-[520px] text-[13px] leading-[1.75] md:text-[14px]',
                  studio ? 'text-[#655a78]' : 'text-[#a7a4b4]',
                )}
              >
                {studio
                  ? 'Tasks grow, rivers flow, gates open. Everything you do is a visible, connected system — and Flux is the quiet intelligence inside it.'
                  : 'Finance, projects, tasks, documents and operations — connected through one calm intelligence layer for Indian industrial businesses.'}
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {['Zoho Books ledger', 'Living project system', 'Flux intelligence'].map((item) => (
                  <span
                    key={item}
                    className={cx(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium',
                      studio
                        ? 'border-[#2b1c44]/10 bg-white/45 text-[#655a78]'
                        : 'border-white/10 bg-white/[0.03] text-[#a7a4b4]',
                    )}
                  >
                    <span className={cx('h-1 w-1 rounded-full', studio ? 'bg-[#6d4aff]' : 'bg-[#22d3ee]')} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-5 lg:mt-0">
              <blockquote
                className={cx(
                  'max-w-[480px] border-l pl-4',
                  studio ? 'border-[#6d4aff]/25' : 'border-[#22d3ee]/25',
                )}
              >
                <p className={cx('k-serif-italic text-[19px] leading-[1.35] md:text-[22px]', studio ? 'text-[#3b2d50]' : 'text-[#ddd6c9]')}>
                  {studio
                    ? '“A river never fights the rock; it carves through it with persistent gentle grace.”'
                    : '“The order that makes motion meaningful is not imposed. It is recognised.”'}
                </p>
                <footer className={cx('mt-2 k-mono text-[8.5px] uppercase tracking-[0.18em]', studio ? 'text-[#8d82a0]' : 'text-[#706d7f]')}>
                  {studio ? 'Nature’s law of momentum · KARM × Tesla field' : 'Ṛta · the living order · KARM field note 001'}
                </footer>
              </blockquote>

              <div className={cx('flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px]', studio ? 'text-[#8d82a0]' : 'text-[#706d7f]')}>
                <span className="flex items-center gap-1.5">
                  <Check size={11} className={studio ? 'text-[#0e7490]' : 'text-[#22d3ee]'} /> Zoho Books connected
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={11} className={studio ? 'text-[#0e7490]' : 'text-[#22d3ee]'} /> Google Workspace ready
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles size={11} className={studio ? 'text-[#6d4aff]' : 'text-[#a78bfa]'} /> Flux intelligence in context
                </span>
              </div>
            </div>
          </section>

          {/* Auth panel */}
          <section
            className={cx(
              'relative flex items-center justify-center border-t px-5 py-10 lg:border-l lg:border-t-0 lg:px-10',
              studio ? 'border-[#2b1c44]/10 bg-white/30' : 'border-white/[0.07] bg-white/[0.015]',
            )}
          >
            <div className="w-full max-w-[430px]">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <div className={cx('k-mono text-[9px] uppercase tracking-[0.24em]', studio ? 'text-[#6d4aff]' : 'text-[#a78bfa]')}>
                    Secure workspace
                  </div>
                  <h2 className={cx('mt-2 text-[34px] font-extrabold tracking-[-0.05em]', studio ? 'text-[#241a33]' : 'text-[#f6f3ec]')}>
                    {studio ? 'Enter the studio' : 'Welcome back'}
                  </h2>
                </div>
                <div
                  className={cx(
                    'flex h-11 w-11 items-center justify-center rounded-full border',
                    studio ? 'border-[#6d4aff]/20 bg-[#6d4aff]/8 text-[#6d4aff]' : 'border-[#22d3ee]/20 bg-[#22d3ee]/8 text-[#22d3ee]',
                  )}
                >
                  <LockKeyhole size={17} />
                </div>
              </div>

              <p className={cx('text-[12px] leading-relaxed', studio ? 'text-[#655a78]' : 'text-[#a7a4b4]')}>
                Use the owner setup code supplied by your organisation. The code is exchanged for a short-lived, secure session.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="workspace-code" className={cx('mb-2 block text-[11px] font-semibold', studio ? 'text-[#3b2d50]' : 'text-[#d7d4e0]')}>
                    Workspace setup code
                  </label>
                  <div className="relative">
                    <input
                      id="workspace-code"
                      type={showCode ? 'text' : 'password'}
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value);
                        if (error) clearError();
                      }}
                      autoComplete="current-password"
                      placeholder="Enter secure code"
                      className={cx(
                        'h-[52px] w-full rounded-[13px] border bg-transparent px-4 pr-12 text-[13px] outline-none transition-all',
                        studio
                          ? 'border-[#2b1c44]/15 bg-white/60 text-[#241a33] placeholder:text-[#a79db8] focus:border-[#6d4aff]/60 focus:ring-4 focus:ring-[#6d4aff]/10'
                          : 'border-white/10 bg-white/[0.035] text-[#f6f3ec] placeholder:text-[#5d5a6b] focus:border-[#22d3ee]/60 focus:ring-4 focus:ring-[#22d3ee]/10',
                      )}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'login-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode((value) => !value)}
                      className={cx('absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5', studio ? 'text-[#8d82a0] hover:text-[#241a33]' : 'text-[#706d7f] hover:text-[#f6f3ec]')}
                      aria-label={showCode ? 'Hide setup code' : 'Show setup code'}
                    >
                      {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div
                    id="login-error"
                    role="alert"
                    className={cx(
                      'rounded-xl border px-3.5 py-2.5 text-[11px]',
                      studio ? 'border-[#be123c]/20 bg-[#be123c]/5 text-[#be123c]' : 'border-[#fb7185]/25 bg-[#fb7185]/8 text-[#fb7185]',
                    )}
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={busy || !code.trim()}
                  className={cx(
                    'flex h-[52px] w-full items-center justify-between rounded-[13px] px-5 text-[12px] font-bold transition-all active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40',
                    studio
                      ? 'bg-[#6d4aff] text-white shadow-[0_10px_34px_rgba(109,74,255,0.28)] hover:bg-[#5b39ee]'
                      : 'bg-[#22d3ee] text-[#041014] shadow-[0_10px_34px_rgba(34,211,238,0.22)] hover:bg-[#4ee1f5]',
                  )}
                >
                  <span>{busy ? 'Verifying workspace…' : 'Enter workspace'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className={cx('h-px flex-1', studio ? 'bg-[#2b1c44]/10' : 'bg-white/[0.08]')} />
                <span className={cx('k-mono text-[8.5px] uppercase tracking-[0.22em]', studio ? 'text-[#a79db8]' : 'text-[#5d5a6b]')}>or</span>
                <span className={cx('h-px flex-1', studio ? 'bg-[#2b1c44]/10' : 'bg-white/[0.08]')} />
              </div>

              <button
                type="button"
                onClick={() => {
                  enterDemo();
                  navigate('today');
                }}
                className={cx(
                  'group flex w-full items-center justify-between rounded-[13px] border px-4 py-3.5 text-left transition-all',
                  studio
                    ? 'border-[#2b1c44]/10 bg-white/45 hover:border-[#6d4aff]/30 hover:bg-white/70'
                    : 'border-white/10 bg-white/[0.025] hover:border-[#22d3ee]/30 hover:bg-white/[0.05]',
                )}
              >
                <div>
                  <div className={cx('text-[12px] font-bold', studio ? 'text-[#241a33]' : 'text-[#f6f3ec]')}>Explore demo workspace</div>
                  <div className={cx('mt-0.5 text-[10.5px]', studio ? 'text-[#8d82a0]' : 'text-[#706d7f]')}>
                    Sample data is clearly labelled throughout.
                  </div>
                </div>
                <ArrowUpRight
                  size={16}
                  className={cx('transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5', studio ? 'text-[#6d4aff]' : 'text-[#22d3ee]')}
                />
              </button>

              <div className={cx('mt-6 flex items-start gap-2 text-[10px] leading-relaxed', studio ? 'text-[#8d82a0]' : 'text-[#5d5a6b]')}>
                <Waves size={13} className="mt-0.5 shrink-0" />
                <span>
                  Protected by automatic session locking and encrypted local safeguards. Live accounting writes always require a human approval inside the workspace.
                </span>
              </div>

              <div className={cx('mt-8 flex items-center justify-between border-t pt-4 text-[9px]', studio ? 'border-[#2b1c44]/10 text-[#a79db8]' : 'border-white/[0.07] text-[#4d4a59]')}>
                <span className="k-mono uppercase tracking-[0.14em]">RTA OS 2.4</span>
                <span className="k-mono uppercase tracking-[0.14em]">Bhopal · IST</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
