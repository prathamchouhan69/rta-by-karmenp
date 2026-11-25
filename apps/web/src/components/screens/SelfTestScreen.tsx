import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CompactStatusDot } from '../common/CompactStatusDot';
import { IconCheck, IconAlert, IconFlux } from '../common/Icons';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'not-run';
  message?: string;
  details?: string;
}

const testCategories = [
  {
    category: 'PWA & Installation',
    tests: [
      { name: 'Standalone Mode', check: () => window.matchMedia('(display-mode: standalone)').matches },
      { name: 'Manifest Valid', check: async () => { const res = await fetch('/manifest.json'); return res.ok; } },
      { name: 'Service Worker Registered', check: async () => { const reg = await navigator.serviceWorker.ready; return !!reg; } },
      { name: 'Service Worker Controls Page', check: async () => { const reg = await navigator.serviceWorker.ready; return reg.active?.state === 'activated'; } },
      { name: 'Offline Shell Cached', check: async () => { const cache = await caches.open('karm-os-cache-v3'); const res = await cache.match('/'); return !!res; } },
    ]
  },
  {
    category: 'Storage & Persistence',
    tests: [
      { name: 'IndexedDB Available', check: () => 'indexedDB' in window },
      { name: 'LocalStorage Available', check: () => { try { localStorage.setItem('test', 'test'); localStorage.removeItem('test'); return true; } catch { return false; } } },
      { name: 'SessionStorage Available', check: () => { try { sessionStorage.setItem('test', 'test'); sessionStorage.removeItem('test'); return true; } catch { return false; } } },
      { name: 'Storage Persist Permission', check: async () => { if ('storage' in navigator && 'persist' in navigator.storage) { return await navigator.storage.persist(); } return true; } },
    ]
  },
  {
    category: 'Hardware & Capabilities',
    tests: [
      { name: 'WebGL2 Available', check: () => { const canvas = document.createElement('canvas'); return !!canvas.getContext('webgl2'); } },
      { name: 'WebGL1 Fallback', check: () => { const canvas = document.createElement('canvas'); return !!canvas.getContext('webgl'); } },
      { name: 'Touch Support', check: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0 },
      { name: 'Device Orientation', check: () => 'DeviceOrientationEvent' in window },
      { name: 'Visual Viewport API', check: () => 'visualViewport' in window },
    ]
  },
  {
    category: 'Platform & Environment',
    tests: [
      { name: 'iOS Safari', check: () => /iPhone|iPad|iPod/.test(navigator.userAgent) },
      { name: 'Standalone Mode', check: () => window.matchMedia('(display-mode: standalone)').matches },
      { name: 'Reduce Motion Preference', check: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches },
      { name: 'Reduced Transparency', check: () => window.matchMedia('(prefers-reduced-transparency: reduce)').matches },
      { name: 'Color Scheme Dark', check: () => window.matchMedia('(prefers-color-scheme: dark)').matches },
      { name: 'Time Zone Asia/Kolkata', check: () => Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata' },
      { name: 'Locale en-IN', check: () => navigator.language.startsWith('en-IN') || navigator.language === 'en' },
    ]
  },
  {
    category: 'Network & Connectivity',
    tests: [
      { name: 'Online Status', check: () => navigator.onLine },
      { name: 'Service Worker Online', check: async () => { try { const res = await fetch('/api/v1/health', { method: 'HEAD', cache: 'no-cache' }); return res.ok; } catch { return false; } } },
      { name: 'Zoho Proxy Reachable', check: async () => { try { const res = await fetch('/api/v1/health', { cache: 'no-cache' }); return res.ok; } catch { return false; } } },
      { name: 'Secure Context', check: () => window.isSecureContext },
    ]
  },
  {
    category: 'Security & Privacy',
    tests: [
      { name: 'Secure Context', check: () => window.isSecureContext },
      { name: 'CSP Header Present', check: async () => { const res = await fetch('/', { method: 'HEAD' }); return !!res.headers.get('content-security-policy'); } },
      { name: 'X-Frame-Options DENY', check: async () => { const res = await fetch('/', { method: 'HEAD' }); return res.headers.get('x-frame-options') === 'DENY'; } },
      { name: 'X-Content-Type-Options nosniff', check: async () => { const res = await fetch('/', { method: 'HEAD' }); return res.headers.get('x-content-type-options') === 'nosniff'; } },
      { name: 'Referrer-Policy no-referrer', check: async () => { const res = await fetch('/', { method: 'HEAD' }); return res.headers.get('referrer-policy') === 'no-referrer'; } },
    ]
  },
  {
    category: 'Storage & Performance',
    tests: [
      { name: 'Storage Estimate', check: async () => { if ('storage' in navigator && 'estimate' in navigator.storage) { const est = await navigator.storage.estimate(); return !!est.quota; } return true; } },
      { name: 'Cache Storage', check: async () => { const keys = await caches.keys(); return keys.length > 0; } },
      { name: 'Memory Info', check: () => 'memory' in performance },
    ]
  },
];

export const SelfTestScreen: React.FC = () => {
  const { setIsSpotlightOpen } = useApp();
  const [results, setResults] = useState<Record<string, TestResult[]>>({});
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('selftest_results');
    if (saved) {
      try {
        setResults(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const runTests = async () => {
    setRunning(true);
    const newResults: Record<string, TestResult[]> = {};

    for (const category of testCategories) {
      const categoryResults: TestResult[] = [];
      for (const test of category.tests) {
        try {
          const result = await test.check();
          categoryResults.push({
            name: test.name,
            status: result ? 'pass' : 'fail',
            message: result ? 'OK' : 'FAILED',
          });
        } catch (error) {
          categoryResults.push({
            name: test.name,
            status: 'fail',
            message: error instanceof Error ? error.message : 'Error',
          });
        }
      }
      newResults[category.category] = categoryResults;
    }

    setResults(newResults);
    localStorage.setItem('selftest_results', JSON.stringify(newResults));
    setRunning(false);
  };

  useEffect(() => {
    if (!results || Object.keys(results).length === 0) {
      runTests();
    }
  }, []);

  const handleShare = async () => {
    const text = Object.entries(results)
      .map(([cat, tests]) => `${cat}\n${tests.map(t => `${t.status === 'pass' ? '✅' : t.status === 'fail' ? '❌' : '⏭️'} ${t.name}${t.message ? ` - ${t.message}` : ''}`).join('\n')}`)
      .join('\n\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ṛta-BY-KARM Self-Test Results', text });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const passCount = Object.values(results).flat().filter(t => t.status === 'pass').length;
  const failCount = Object.values(results).flat().filter(t => t.status === 'fail').length;
  const notRunCount = Object.values(results).flat().filter(t => t.status === 'not-run').length;
  const total = passCount + failCount + notRunCount;

  return (
    <div className="fixed inset-0 z-50 bg-[#05070a] flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#06080d]/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSpotlightOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close self-test"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-white text-lg">Self-Test</h1>
            <p className="text-xs text-slate-400">Diagnostic report for Ṛta-BY-KARM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runTests}
            disabled={running}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Tests'}
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all"
          >
            Share
          </button>
        </div>
      </header>

      {/* Summary */}
      <div className="p-4 border-b border-white/10">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <div className="text-2xl font-bold text-sky-400">{passCount}</div>
            <div className="text-[10px] text-slate-400">PASS</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div className="text-2xl font-bold text-rose-400">{failCount}</div>
            <div className="text-[10px] text-slate-400">FAIL</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/30">
            <div className="text-2xl font-bold text-slate-400">{notRunCount}</div>
            <div className="text-[10px] text-slate-400">NOT RUN</div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-2">{total} checks total • {running ? 'Running...' : 'Last run: ' + new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })}</p>
      </div>

      {/* Test Categories */}
      <div className="p-4 space-y-4 pb-20">
        {testCategories.map(category => {
          const catResults = results[category.category] || [];
          const catPass = catResults.filter(t => t.status === 'pass').length;
          const catFail = catResults.filter(t => t.status === 'fail').length;
          const catTotal = catResults.length;
          const isExpanded = expanded[category.category] ?? true;

          return (
            <details key={category.category} className="bg-[#07090e]/80 rounded-2xl border border-white/10 overflow-hidden" open={isExpanded}>
              <summary
                onClick={() => setExpanded(prev => ({ ...prev, [category.category]: !isExpanded }))}
                className="flex items-center justify-between p-4 cursor-pointer list-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${catFail > 0 ? 'bg-rose-400' : catPass === catTotal ? 'bg-sky-400' : 'bg-amber-400'}`} />
                  <span className="font-bold text-white text-sm">{category.category}</span>
                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/10">
                    {catPass}/{catTotal}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="px-4 pb-4 space-y-2">
                {category.tests.map((test, index) => {
                  const result = catResults[index];
                  const status = result?.status || 'not-run';
                  return (
                    <div key={`${category.category}-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full ${status === 'pass' ? 'bg-sky-400' : status === 'fail' ? 'bg-rose-400' : 'bg-slate-500'}`} />
                        <span className="text-sm font-medium text-white truncate">{test.name}</span>
                        {result?.message && result.message !== 'OK' && result.message !== 'FAILED' && (
                          <span className="text-[10px] text-slate-500 ml-auto">{result.message}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${status === 'pass' ? 'text-sky-400' : status === 'fail' ? 'text-rose-400' : 'text-slate-500'}`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#06080d]/95 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Ṛta-BY-KARM Self-Test v1.0</span>
          <span>Run on device for accurate results</span>
          <span>{new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
        </div>
      </footer>
    </div>
  );
};

export default SelfTestScreen;