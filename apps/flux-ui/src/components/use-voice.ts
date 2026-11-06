'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@/lib/types';

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(onText: (text: string) => void, lang: Lang) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<RecognitionLike | null>(null);
  const callback = useRef(onText);
  callback.current = onText;

  useEffect(() => {
    const ctor = getCtor();
    setSupported(!!ctor);
    return () => {
      recognition.current?.abort();
      recognition.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognition.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const ctor = getCtor();
    if (!ctor) {
      setError('Voice input is not supported in this browser. Type instead.');
      return;
    }
    setError(null);
    if (recognition.current) {
      recognition.current.abort();
      recognition.current = null;
    }
    const engine = new ctor();
    engine.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    engine.continuous = false;
    engine.interimResults = false;
    engine.maxAlternatives = 1;
    engine.onresult = (event) => {
      const parts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result?.[0]?.transcript) parts.push(result[0].transcript);
      }
      const text = parts.join(' ').trim();
      if (text) callback.current(text);
    };
    engine.onerror = (event) => {
      const code = event.error || 'unknown';
      setError(code === 'not-allowed' || code === 'service-not-allowed'
        ? 'Microphone permission was blocked. Allow it in the browser or type instead.'
        : `Voice input stopped (${code}). You can type instead.`);
      setListening(false);
    };
    engine.onend = () => setListening(false);
    recognition.current = engine;
    try {
      engine.start();
      setListening(true);
    } catch {
      setError('Voice input could not start. Type instead.');
      setListening(false);
    }
  }, [lang]);

  return { supported, listening, error, start, stop, toggle: () => (listening ? stop() : start()) };
}
