'use client';

import type { ReactNode } from 'react';
import { Badge, Disclaimer, Notice } from './ui';
import { formatValue, humanLabel, isScalar } from '@/lib/format';

type Json = Record<string, unknown>;

const META = new Set([
  'ok', 'currency', 'confidence', 'source', 'assumptions', 'limitations',
  'disclaimer', 'investmentDisclaimer', 'disclaimers', 'sourceType', 'generatedAt',
  'reviewedAt', 'lastReviewed', 'verificationRequired', 'verifyNote', 'live',
]);

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordArray(value: unknown): value is Json[] {
  return Array.isArray(value) && value.length > 0 && value.every(isRecord);
}

function tableColumns(rows: Json[]): string[] {
  const keys: string[] = [];
  for (const row of rows.slice(0, 12)) {
    for (const [key, value] of Object.entries(row)) {
      if (isScalar(value) && !keys.includes(key)) keys.push(key);
    }
  }
  return keys.slice(0, 9);
}

function ScalarRows({ data, currency }: { data: Json; currency: string }) {
  const entries = Object.entries(data).filter(([key, value]) => isScalar(value) && !META.has(key));
  if (!entries.length) return null;
  return (
    <dl className="kv">
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: 'contents' }}>
          <dt>{humanLabel(key)}</dt>
          <dd>{formatValue(key, value, currency)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataTable({ rows, currency }: { rows: Json[]; currency: string }) {
  const columns = tableColumns(rows);
  if (!columns.length) return null;
  return (
    <div className="data-table-wrap" style={{ maxHeight: '19rem', overflowY: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{humanLabel(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {columns.map((column) => (
                <td key={column} className={typeof row[column] === 'number' ? 'num' : undefined}>
                  {formatValue(column, row[column], currency)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertList({ items }: { items: unknown[] }) {
  return (
    <ul className="bullets" style={{ listStyle: 'none', paddingLeft: 0 }}>
      {items.map((item, index) => {
        if (typeof item === 'string') return <li key={index}>{item}</li>;
        if (!isRecord(item)) return <li key={index}>{String(item)}</li>;
        const severity = String(item.severity ?? item.priority ?? 'info');
        const tone = severity === 'high' ? 'danger' : severity === 'medium' ? 'warn' : 'ok';
        return (
          <li key={index} className="row" style={{ alignItems: 'flex-start' }}>
            <Badge tone={tone}>{severity}</Badge>
            <span style={{ flex: 1 }}>
              {item.message ? String(item.message) : item.action ? <><strong>{String(item.action)}</strong>{item.detail ? ` — ${String(item.detail)}` : ''}</> : JSON.stringify(item)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SectionValue({ name, value, currency, depth }: { name: string; value: unknown; currency: string; depth: number }) {
  if (isScalar(value)) {
    const text = formatValue(name, value, currency);
    if (text.length > 90) {
      return (
        <div className="stack-sm">
          <div className="result-subhead">{humanLabel(name)}</div>
          <p className="soft" style={{ fontSize: '0.88rem' }}>{text}</p>
        </div>
      );
    }
    return (
      <dl className="kv">
        <div style={{ display: 'contents' }}>
          <dt>{humanLabel(name)}</dt>
          <dd>{text}</dd>
        </div>
      </dl>
    );
  }
  if (Array.isArray(value)) {
    if (!value.length) return null;
    if (isRecordArray(value)) {
      return (
        <div className="stack-sm">
          <div className="result-subhead">{humanLabel(name)}</div>
          <DataTable rows={value} currency={currency} />
        </div>
      );
    }
    return (
      <div className="stack-sm">
        <div className="result-subhead">{humanLabel(name)}</div>
        <ul className="bullets">
          {value.map((item, index) => (
            <li key={index}>{isScalar(item) ? String(item) : JSON.stringify(item)}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (isRecord(value) && depth < 2) {
    return (
      <div className="panel flat" style={{ marginTop: '0.7rem' }}>
        <div className="result-subhead" style={{ marginTop: 0 }}>{humanLabel(name)}</div>
        <ScalarRows data={value} currency={currency} />
        {Object.entries(value)
          .filter(([key, child]) => !isScalar(child) && !META.has(key))
          .map(([key, child]) => (
            <SectionValue key={key} name={key} value={child} currency={currency} depth={depth + 1} />
          ))}
      </div>
    );
  }
  return null;
}

export function ResultView({ data, title }: { data: unknown; title?: string }) {
  if (!isRecord(data)) {
    return <div className="panel flat">{data == null ? 'No result.' : String(data)}</div>;
  }
  const currency = typeof data.currency === 'string' ? data.currency : 'INR';
  const failed = data.ok === false;
  const topScalars = Object.entries(data).filter(([key, value]) => isScalar(value) && !META.has(key));
  const metricEntries = topScalars.filter(([, value]) => typeof value === 'number' || typeof value === 'boolean');
  const longTexts = topScalars.filter(([key, value]) => typeof value === 'string' && (String(value).length > 70 || ['message', 'summary', 'status', 'interpretation', 'code', 'label'].includes(key)));
  const shortTexts = topScalars.filter(([key, value]) => typeof value === 'string' && !longTexts.some(([other]) => other === key));

  const objectSections = Object.entries(data).filter(([key, value]) => isRecord(value) && !META.has(key) && key !== 'fields');
  const arraySections = Object.entries(data).filter(([key, value]) => Array.isArray(value) && !META.has(key));
  const fieldsObject = isRecord(data.fields) ? data.fields : null;

  const disclaimer = [data.disclaimer, data.investmentDisclaimer]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const listDisclaimers = Array.isArray(data.disclaimers)
    ? data.disclaimers.filter((value): value is string => typeof value === 'string')
    : [];
  const allDisclaimers = [...new Set([...disclaimer, ...listDisclaimers])];
  const assumptions = Array.isArray(data.assumptions) ? data.assumptions : [];
  const limitations = Array.isArray(data.limitations) ? data.limitations : [];
  const liveNote = data.live === false || data.verificationRequired === true
    ? 'This is curated or caller-supplied information, not a live feed. Verify with the official source before acting.'
    : null;

  return (
    <div className="panel">
      {failed ? (
        <Notice tone="danger" title={typeof data.code === 'string' ? data.code.replaceAll('_', ' ') : 'Could not calculate'}>
          {typeof data.message === 'string' ? data.message : 'The calculation could not be completed with these inputs.'}
        </Notice>
      ) : null}

      {title || data.confidence ? (
        <div className="result-head">
          {title ? <h3 style={{ fontSize: '1.12rem' }}>{title}</h3> : <span />}
          <div className="row">
            {typeof data.confidence === 'string' ? (
              <Badge tone={data.confidence === 'high' ? 'ok' : data.confidence === 'medium' ? 'warn' : 'danger'}>
                confidence: {data.confidence}
              </Badge>
            ) : null}
            {typeof data.sourceType === 'string' ? <Badge>{data.sourceType.replaceAll('_', ' ')}</Badge> : null}
          </div>
        </div>
      ) : null}

      {failed ? null : (
        <>
          {longTexts.length ? (
            <div className="stack-sm" style={{ marginBottom: '0.8rem' }}>
              {longTexts.map(([key, value]) => {
                const text = String(value);
                if (['status', 'code', 'label', 'interpretation'].includes(key) && text.length < 90) {
                  return (
                    <div key={key} className="row">
                      <Badge tone={key === 'status' ? 'accent' : undefined}>{humanLabel(key)}</Badge>
                      <span className="soft" style={{ fontSize: '0.88rem' }}>{text}</span>
                    </div>
                  );
                }
                return (
                  <p key={key} className="notice" style={{ margin: 0 }}>
                    <strong>{humanLabel(key)}: </strong>
                    {text}
                  </p>
                );
              })}
            </div>
          ) : null}

          {shortTexts.length ? (
            <div className="stat-grid" style={{ marginBottom: '0.8rem' }}>
              {shortTexts.map(([key, value]) => (
                <div className="stat" key={key}>
                  <div className="stat-label">{humanLabel(key)}</div>
                  <div className="stat-value small">{formatValue(key, value, currency)}</div>
                </div>
              ))}
            </div>
          ) : null}

          {metricEntries.length ? (
            <div className="stat-grid">
              {metricEntries.map(([key, value]) => (
                <div className="stat" key={key}>
                  <div className="stat-label">{humanLabel(key)}</div>
                  <div className="stat-value">{formatValue(key, value, currency)}</div>
                </div>
              ))}
            </div>
          ) : null}

          {fieldsObject ? (
            <div style={{ marginTop: '0.9rem' }}>
              <div className="result-subhead">Extracted fields</div>
              <ScalarRows data={fieldsObject} currency={currency} />
              {Object.entries(fieldsObject)
                .filter(([, value]) => !isScalar(value))
                .map(([key, value]) => (
                  <SectionValue key={key} name={key} value={value} currency={currency} depth={0} />
                ))}
            </div>
          ) : null}

          {objectSections.map(([key, value]) => (
            <SectionValue key={key} name={key} value={value} currency={currency} depth={0} />
          ))}

          {arraySections.map(([key, value]) => {
            if (!Array.isArray(value) || value.length === 0) return null;
            if (['alerts', 'warnings', 'recommendations', 'missingInputs', 'commonTraps'].includes(key)) {
              return (
                <div key={key} className="stack-sm" style={{ marginTop: '0.9rem' }}>
                  <div className="result-subhead">{humanLabel(key)}</div>
                  <AlertList items={value} />
                </div>
              );
            }
            return <SectionValue key={key} name={key} value={value} currency={currency} depth={0} />;
          })}
        </>
      )}

      {liveNote ? <Notice tone="warn">{liveNote}</Notice> : null}

      {assumptions.length || limitations.length ? (
        <details className="trace">
          <summary>Assumptions, sources and limits</summary>
          {typeof data.source === 'string' ? <p className="fineprint" style={{ marginTop: '0.5rem' }}><strong>Source:</strong> {data.source}</p> : null}
          {assumptions.length ? (
            <>
              <div className="result-subhead">Assumptions</div>
              <ul className="bullets">
                {assumptions.map((item, index) => <li key={index}>{String(item)}</li>)}
              </ul>
            </>
          ) : null}
          {limitations.length ? (
            <>
              <div className="result-subhead">Limitations</div>
              <ul className="bullets">
                {limitations.map((item, index) => <li key={index}>{String(item)}</li>)}
              </ul>
            </>
          ) : null}
        </details>
      ) : typeof data.source === 'string' ? (
        <p className="fineprint" style={{ marginTop: '0.7rem' }}><strong>Source:</strong> {data.source}</p>
      ) : null}

      {allDisclaimers.map((text) => (
        <Disclaimer key={text}>{text}</Disclaimer>
      ))}
    </div>
  );
}

export function ResultHeaderNote({ children }: { children: ReactNode }) {
  return <p className="fineprint" style={{ marginBottom: '0.7rem' }}>{children}</p>;
}
