'use client';

import { useState } from 'react';
import { Badge } from '../ui';
import { Icon } from '../icons';
import type { ChatResponse } from '@/lib/chat-types';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  body: string;
  response?: ChatResponse;
  queued?: boolean;
  createdAt: string;
}

function EvidenceList({ response }: { response: ChatResponse }) {
  const evidence = response.evidence ?? [];
  const trace = response.trace ?? [];
  if (!evidence.length && !trace.length) return null;
  return (
    <details className="trace">
      <summary>
        {evidence.length} evidence item{evidence.length === 1 ? '' : 's'} · {trace.length} tool step{trace.length === 1 ? '' : 's'}
      </summary>
      {evidence.length ? (
        <ul className="bullets" style={{ marginTop: '0.5rem' }}>
          {evidence.map((item) => (
            <li key={item.id}>
              <span className="mono">{item.id}</span> · {item.label} · <span className="faint">{item.source}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {trace.length ? (
        <pre>{JSON.stringify(trace, null, 2)}</pre>
      ) : null}
    </details>
  );
}

export function ChatBubble({ message }: { message: ChatMessageData }) {
  const [copied, setCopied] = useState(false);
  const response = message.response;
  const warnings = response?.warnings ?? [];
  const verification = response?.verification;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (message.role === 'system') {
    return <div className="notice warn" role="status">{message.body}</div>;
  }

  return (
    <article className={`bubble ${message.role === 'user' ? 'user' : ''}`} aria-label={message.role === 'user' ? 'Your message' : 'Flux answer'}>
      <div className="bubble-meta">
        <span>{message.role === 'user' ? 'You' : 'Flux'}</span>
        {message.queued ? <Badge tone="warn">queued offline</Badge> : null}
        {response?.model ? <span className="mono" style={{ textTransform: 'none', letterSpacing: 0 }}>{response.model}</span> : null}
        {response?.fallbackUsed ? <Badge tone="warn">fallback model</Badge> : null}
        {verification?.done ? <Badge tone={verification.unsupported?.length ? 'warn' : 'ok'}>{verification.unsupported?.length ? 'partly unverified' : 'verified pass done'}</Badge> : null}
        {message.role === 'assistant' && !message.queued ? (
          <button type="button" className="button ghost small" onClick={copy} style={{ marginLeft: 'auto', minHeight: '1.6rem', padding: '0.1rem 0.45rem' }}>
            {copied ? <Icon name="check" size={13} /> : null}
            {copied ? 'Copied' : 'Copy'}
          </button>
        ) : null}
      </div>

      <div className="bubble-body">{message.body}</div>

      {message.queued ? (
        <p className="fineprint" style={{ marginTop: '0.4rem' }}>Waiting for a connection. Nothing has been sent yet.</p>
      ) : null}

      {warnings.length ? (
        <div className="stack-sm" style={{ marginTop: '0.65rem' }}>
          {warnings.map((warning, index) => (
            <div className="notice warn" key={index} style={{ fontSize: '0.8rem' }}>{warning}</div>
          ))}
        </div>
      ) : null}

      {response?.unsupportedNumbers?.length ? (
        <div className="notice danger" style={{ marginTop: '0.65rem', fontSize: '0.8rem' }}>
          <strong>Unsupported figures were found: </strong>
          {response.unsupportedNumbers.slice(0, 8).join(', ')}. Treat them as unverified.
        </div>
      ) : null}

      {verification?.done && verification.unsupported?.length ? (
        <div className="notice warn" style={{ marginTop: '0.65rem', fontSize: '0.8rem' }}>
          <strong>Verification could not support: </strong>
          {verification.unsupported.join('; ')}
        </div>
      ) : null}

      {response ? <EvidenceList response={response} /> : null}
    </article>
  );
}
