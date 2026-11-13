'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Badge, CheckboxField, EmptyState, InlineError, Notice, SelectField, TextField } from '../ui';
import { Icon } from '../icons';
import { ChatBubble, type ChatMessageData } from './chat-message';
import { useVoiceInput } from '../use-voice';
import { useSession, useUi, can } from '../providers';
import { api, errorMessage } from '@/lib/api';
import type { ChatResponse } from '@/lib/chat-types';
import { clearQueue, enqueueMessage, loadQueue, queueEventName, removeQueued, type QueuedMessage } from '@/lib/offline-queue';

const STORAGE = 'flux_chat_history_v1';

function newId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function recentTurns(messages: ChatMessageData[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter((message): message is ChatMessageData & { role: 'user' | 'assistant' } =>
      !message.queued && (message.role === 'user' || message.role === 'assistant'))
    .slice(-8)
    .map((message) => ({ role: message.role, content: message.body.slice(0, 2000) }));
}

function restore(): ChatMessageData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is ChatMessageData => {
      const item = row as Partial<ChatMessageData> | null;
      return !!item && typeof item.id === 'string' && typeof item.body === 'string' && (item.role === 'user' || item.role === 'assistant' || item.role === 'system')
        && (item.queueId === undefined || typeof item.queueId === 'string');
    });
  } catch {
    return [];
  }
}

export function ChatPanel() {
  const user = useSession();
  const { t, lang } = useUi();
  const allowed = can(user, 'chat');
  const canUseContext = can(user, 'read:zoho');
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [deep, setDeep] = useState(false);
  const [verify, setVerify] = useState(false);
  const [useRecentContext, setUseRecentContext] = useState(false);
  const [screen, setScreen] = useState('none');
  const [recordId, setRecordId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const thread = useRef<HTMLDivElement>(null);
  const flushing = useRef(false);

  const voice = useVoiceInput((text) => setInput((current) => (current ? `${current} ${text}` : text)), lang);

  const append = useCallback((message: ChatMessageData) => {
    setMessages((current) => [...current, message].slice(-60));
  }, []);

  const ask = useCallback(async (
    text: string,
    options: { deep: boolean; verify: boolean },
    history: { role: 'user' | 'assistant'; content: string }[],
  ) => {
    const payload = {
      message: text,
      deep: options.deep,
      verify: options.verify,
      history,
      context: canUseContext && screen !== 'none'
        ? { screen, ...(recordId.trim() ? { recordId: recordId.trim() } : {}) }
        : null,
    };
    return api<ChatResponse>('v1/chat', { method: 'POST', body: payload });
  }, [canUseContext, recordId, screen]);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    const items = loadQueue();
    if (!items.length) {
      setQueue([]);
      return;
    }
    flushing.current = true;
    setBusy(true);
    const previousMessages = messages.filter((message) => !message.queued);
    try {
      for (const item of items) {
        try {
          const history = useRecentContext ? recentTurns(previousMessages) : [];
          const response = await ask(item.message, { deep: item.deep, verify: item.verify }, history);
          const queuedMessage = messages.find((message) => message.queueId === item.id);
          if (queuedMessage) {
            setMessages((current) => current.map((message) => message.queueId === item.id
              ? { ...message, queued: false, queueId: undefined }
              : message));
          } else {
            append({ id: newId(), role: 'user', body: item.message, createdAt: item.createdAt });
          }
          append({ id: newId(), role: 'assistant', body: response.answer, response, createdAt: new Date().toISOString() });
          previousMessages.push(
            { id: newId(), role: 'user', body: item.message, createdAt: item.createdAt },
            { id: newId(), role: 'assistant', body: response.answer, response, createdAt: new Date().toISOString() },
          );
          removeQueued(item.id);
        } catch (issue) {
          setError(errorMessage(issue));
          break;
        }
      }
    } finally {
      setQueue(loadQueue());
      setBusy(false);
      flushing.current = false;
    }
  }, [append, ask, messages, useRecentContext]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    setMessages(restore());
    setQueue(loadQueue());
    setOnline(navigator.onLine);
    const onQueue = () => setQueue(loadQueue());
    const goOnline = () => {
      setOnline(true);
      void flushRef.current();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener(queueEventName(), onQueue);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener(queueEventName(), onQueue);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(STORAGE, JSON.stringify(messages.slice(-40)));
    const last = thread.current?.lastElementChild;
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy]);

  function send() {
    const text = input.trim();
    if (!text || busy || !allowed) return;
    setError('');
    setInput('');
    if (!navigator.onLine) {
      const queued = enqueueMessage(text, deep, verify);
      append({ id: newId(), queueId: queued.id, role: 'user', body: text, queued: true, createdAt: queued.createdAt });
      return;
    }
    const history = useRecentContext ? recentTurns(messages) : [];
    append({ id: newId(), role: 'user', body: text, createdAt: new Date().toISOString() });
    setBusy(true);
    ask(text, { deep, verify }, history)
      .then((response) => append({ id: newId(), role: 'assistant', body: response.answer, response, createdAt: new Date().toISOString() }))
      .catch((issue) => setError(errorMessage(issue)))
      .finally(() => setBusy(false));
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  function clearThread() {
    setMessages([]);
    setError('');
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE);
  }

  if (!allowed) {
    return (
      <Notice tone="warn" title="Chat is not available for your role.">
        You can still read the briefing. Ask an owner to grant chat access if you need it.
      </Notice>
    );
  }

  return (
    <div className="stack">
      <div className="row-between">
        <div className="row">
          <Badge tone={online ? 'ok' : 'warn'}>{online ? t('common.online') : t('common.offline')}</Badge>
          <span className="fineprint">Read-only tools. Flux cannot write, send or approve.</span>
        </div>
        <div className="row">
          {messages.length ? (
            <button className="button ghost small" type="button" onClick={clearThread}>
              <Icon name="trash" size={14} />
              {t('common.clear')}
            </button>
          ) : null}
        </div>
      </div>

      {queue.length ? (
        <div className="notice warn">
          <div className="row-between">
            <span><strong>{queue.length}</strong> message{queue.length === 1 ? '' : 's'} queued offline.</span>
            <span className="row">
              <button className="button small" type="button" onClick={() => void flush()} disabled={busy || !online}>
                {t('common.send')} now
              </button>
              <button className="button ghost small" type="button" onClick={() => { clearQueue(); setQueue([]); }}>
                {t('chat.clearQueue')}
              </button>
            </span>
          </div>
        </div>
      ) : null}

      <div className="chat-layout">
        <div className="chat-thread" ref={thread} aria-live="polite">
          {messages.length === 0 ? (
            <EmptyState title="Ask a real question">
              <p>{t('chat.empty')}</p>
              <p className="fineprint" style={{ marginTop: '0.5rem' }}>
                Try: “Our steel quote rose. What should I check before accepting it?” or “Explain working capital with a simple example.”
              </p>
            </EmptyState>
          ) : (
            messages.map((message) => <ChatBubble key={message.id} message={message} />)
          )}
          {busy ? (
            <div className="loading-row" role="status">
              <span className="spinner" aria-hidden="true" />
              {t('chat.thinking')}
            </div>
          ) : null}
        </div>

        {error ? <InlineError message={error} /> : null}

        <div className="composer">
          {canUseContext ? (
            <details>
              <summary className="fineprint" style={{ cursor: 'pointer' }}>{t('chat.context')}</summary>
              <div className="form-grid" style={{ marginTop: '0.6rem' }}>
                <SelectField
                  label={t('chat.screen')}
                  value={screen}
                  onChange={setScreen}
                  options={[
                    { value: 'none', label: 'No screen context' },
                    { value: 'invoices', label: 'Invoice' },
                    { value: 'customers', label: 'Customer' },
                    { value: 'reports', label: 'Reports (no data connected)' },
                  ]}
                />
                {screen === 'invoices' || screen === 'customers' ? (
                  <TextField
                    label={t('chat.recordId')}
                    value={recordId}
                    onChange={setRecordId}
                    placeholder="Zoho record ID"
                    maxLength={80}
                  />
                ) : null}
              </div>
            </details>
          ) : null}

          <div className="composer-row">
            <textarea
              className="textarea"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onComposerKey}
              placeholder={t('chat.placeholder')}
              maxLength={4000}
              rows={2}
              aria-label={t('chat.placeholder')}
            />
            <button
              className="icon-button"
              type="button"
              onClick={voice.toggle}
              aria-label={voice.listening ? t('chat.listening') : t('chat.voice')}
              title={voice.supported ? t('chat.voice') : 'Voice input is not supported in this browser'}
              disabled={!voice.supported}
              style={voice.listening ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
            >
              <Icon name="mic" size={19} />
            </button>
            <button className="button primary icon" type="button" onClick={send} disabled={!input.trim() || busy} aria-label={t('common.send')}>
              {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="send" size={18} />}
            </button>
          </div>

          <div className="chat-tools">
            <CheckboxField label={t('chat.deep')} checked={deep} onChange={setDeep} />
            <CheckboxField label={t('chat.verify')} checked={verify} onChange={setVerify} />
            <CheckboxField label={t('chat.recentContext')} checked={useRecentContext} onChange={setUseRecentContext} />
            <span className="fineprint" style={{ marginLeft: 'auto' }}>{input.length}/4000 · Enter to send</span>
          </div>
          {useRecentContext ? <p className="fineprint">{t('chat.recentContextPrivacy')}</p> : null}
          {voice.error ? <p className="fineprint" style={{ color: 'var(--danger)' }}>{voice.error}</p> : null}
          {!voice.supported ? <p className="fineprint">Voice input needs a browser with SpeechRecognition. Typing always works.</p> : null}
        </div>
      </div>
    </div>
  );
}
