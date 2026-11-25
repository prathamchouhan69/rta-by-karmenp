import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { IconLock, IconUnlock } from '../common/Icons';

export const LockScreen: React.FC = () => {
  const { 
    isLocked, 
    setIsLocked, 
    savingStatus,
    isOnline,
    triggerZohoLiveScan,
    zohoScanState,
    lastZohoScanTime,
    themeMode,
    setThemeMode,
    isIslandExpanded,
    setIsIslandExpanded
  } = useApp();

  const [unlockCode, setUnlockCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const lockoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-lock after 5 minutes of inactivity
  const AUTO_LOCK_MS = 5 * 60 * 1000;
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 60 * 1000; // 1 minute

  // In production, this would be a securely stored hash
  const VALID_PASSCODE = '1234'; // In production, use secure hash comparison

  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimeoutRef.current) clearTimeout(autoLockTimeoutRef.current);
    autoLockTimeoutRef.current = setTimeout(() => {
      setIsLocked(true);
      setAttempts(0);
    }, AUTO_LOCK_MS);
  }, []);

  useEffect(() => {
    if (isLocked) {
      if (autoLockTimeoutRef.current) clearTimeout(autoLockTimeoutRef.current);
      inputRef.current?.focus();
    } else {
      resetAutoLockTimer();
    }
    return () => {
      if (autoLockTimeoutRef.current) clearTimeout(autoLockTimeoutRef.current);
      if (lockoutTimeoutRef.current) clearTimeout(lockoutTimeoutRef.current);
    };
  }, [isLocked, resetAutoLockTimer]);

  // Lockout timer
  useEffect(() => {
    if (isLockedOut && lockoutTimer > 0) {
      lockoutTimeoutRef.current = setTimeout(() => {
        setLockoutTimer(t => t - 1);
      }, 1000);
    } else if (lockoutTimer === 0 && isLockedOut) {
      setIsLockedOut(false);
      setAttempts(0);
    }
    return () => {
      if (lockoutTimeoutRef.current) clearTimeout(lockoutTimeoutRef.current);
    };
  }, [isLockedOut, lockoutTimer]);

  // Clear sensitive caches and data on lock
  const clearSensitiveData = useCallback(() => {
    try {
      // Clear sensitive app data but preserve user preferences
      localStorage.removeItem('karm_notes');
      localStorage.removeItem('karm_selections');
      // Preserve theme preference
      // localStorage.removeItem('karm_theme_mode'); // Keep theme
      // Clear any other sensitive app-specific data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('karm_') && !key.includes('theme')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // Failed to clear sensitive data on lock - silent fail in production
    }
  }, []);

  const handleUnlock = useCallback(() => {
    if (isLockedOut) return;
    
    // In production, use secure hash comparison
    if (unlockCode === VALID_PASSCODE) {
      setIsLocked(false);
      setUnlockCode('');
      setAttempts(0);
      setIsLockedOut(false);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setUnlockCode('');
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLockedOut(true);
        setLockoutTimer(LOCKOUT_DURATION / 1000);
      }
    }
  }, [attempts, isLockedOut, unlockCode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  }, [handleUnlock]);

  // Sync status
  const isSyncing = zohoScanState === 'scanning' || zohoScanState === 'syncing';
  const isSaving = savingStatus === 'saving';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070a] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      <div className="w-full max-w-md mx-4 p-8 space-y-6">
        {/* KARM Logo */}
        <div className="flex justify-center">
          <img 
            src="/karm-logo-original.png" 
            alt="KARM OS" 
            className="w-24 h-24 object-contain filter drop-shadow-[0_0_20px_rgba(0,242,254,0.3)]" 
          />
        </div>

        <div className="text-center space-y-2">
          <h1 id="lock-title" className="text-2xl font-bold tracking-tight">KARM OS</h1>
          <p className="text-slate-400 text-sm">Locked — Enter passcode to continue</p>
        </div>

        {/* Lock Status Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400 animate-pulse" aria-hidden="true" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Device Locked</span>
        </div>

        {/* Lockout Warning */}
        {isLockedOut && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-rose-400">
              <span className="text-lg">🔒</span>
              <span className="font-bold">Too many failed attempts</span>
            </div>
            <p className="text-sm text-slate-300">
              Try again in <span className="font-mono font-bold text-rose-400">{lockoutTimer}s</span>
            </p>
          </div>
        )}

        {/* Passcode Input */}
        {!isLockedOut && (
          <div className="space-y-4">
            <label htmlFor="unlock-code" className="sr-only">Passcode</label>
            <input
              ref={inputRef}
              id="unlock-code"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={4}
              className="w-full text-center text-3xl font-mono tracking-widest bg-[#07090e] border-2 border-white/10 rounded-2xl px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              placeholder="••••"
              aria-label="Enter 4-digit passcode"
            />
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
              <span>Attempts: {attempts}/{MAX_ATTEMPTS}</span>
              <div className="flex gap-1" aria-label="Attempt indicators">
                {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < attempts ? 'bg-rose-400' : 'bg-white/10'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <button
            onClick={triggerZohoLiveScan}
            disabled={isSyncing || !isOnline}
            className="w-full px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative flex items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isSyncing ? 'animate-spin' : ''}`}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync Live Zoho Books'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setThemeMode(themeMode === 'night' ? 'day' : themeMode === 'day' ? 'classic' : 'night')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              Theme: {themeMode}
            </button>
            <button
              onClick={() => setIsIslandExpanded(!isIslandExpanded)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              Island: {isIslandExpanded ? 'Expanded' : 'Collapsed'}
            </button>
          </div>

          {/* Sync Status */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
            <span className={`flex items-center gap-1 ${isOnline ? 'text-sky-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-sky-400' : 'bg-rose-400'}`} aria-hidden="true" />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <span>Last sync: {lastZohoScanTime || 'Never'}</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-mono text-slate-500">
          KARM OS v1.0 — Locked at {new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>
    </div>
  );
};

export default LockScreen;