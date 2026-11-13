'use client';

import { useRef, useState, type FormEvent } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Section } from '@/components/ui';
import { useSession, can } from '@/components/providers';

const MAX_SAFE_AMOUNT = Number.MAX_SAFE_INTEGER;

interface CashFlowInput {
  openingBalance: string;
  monthlyInflows: string;
  monthlyOutflows: string;
  months: string;
}

interface CashFlowRow {
  month: number;
  inflow: number;
  outflow: number;
  net: number;
  closingBalance: number;
}

interface CashFlowResponse {
  ok: boolean;
  openingBalance: number;
  rows: CashFlowRow[];
  totalInflow: number;
  totalOutflow: number;
  closingBalance: number;
  lowestBalance: number;
  lowestBalanceMonth: number;
  firstNegativeMonth: number | null;
  runwayMonths: number | null;
  status: string;
  confidence: string;
  assumptions: string[];
  source: string;
  limitations: string[];
  investmentDisclaimer: string;
}

interface CashFlowPayload {
  openingBalance: number;
  monthlyInflows: number;
  monthlyOutflows: number;
  months: number;
}

type FieldName = keyof CashFlowInput;
type FieldErrors = Partial<Record<FieldName, string>>;

const INITIAL_INPUT: CashFlowInput = {
  openingBalance: '',
  monthlyInflows: '',
  monthlyOutflows: '',
  months: '',
};

function parseAmount(value: string, label: string, allowNegative = false): { value?: number; error?: string } {
  if (!value.trim()) return { error: `${label} is required.` };
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return { error: `${label} must be a finite number.` };
  if (Math.abs(parsed) > MAX_SAFE_AMOUNT) return { error: `${label} is outside the safe calculation range.` };
  if (!allowNegative && parsed < 0) return { error: `${label} cannot be negative.` };
  return { value: parsed };
}

function parseInput(input: CashFlowInput): { payload?: CashFlowPayload; errors: FieldErrors } {
  const opening = parseAmount(input.openingBalance, 'Opening balance', true);
  const inflows = parseAmount(input.monthlyInflows, 'Monthly inflows');
  const outflows = parseAmount(input.monthlyOutflows, 'Monthly outflows');
  const errors: FieldErrors = {};
  if (opening.error) errors.openingBalance = opening.error;
  if (inflows.error) errors.monthlyInflows = inflows.error;
  if (outflows.error) errors.monthlyOutflows = outflows.error;

  const months = Number(input.months);
  if (!input.months.trim()) errors.months = 'Forecast horizon is required.';
  else if (!Number.isSafeInteger(months) || months < 1 || months > 120) {
    errors.months = 'Enter a whole number from 1 to 120.';
  }

  if (
    opening.value !== undefined &&
    inflows.value !== undefined &&
    outflows.value !== undefined &&
    Number.isSafeInteger(months) &&
    months >= 1 &&
    months <= 120 &&
    Math.abs(opening.value) + months * (inflows.value + outflows.value) > MAX_SAFE_AMOUNT
  ) {
    errors.monthlyInflows = 'These amounts are too large to safely calculate across this horizon.';
    errors.monthlyOutflows = errors.monthlyInflows;
  }

  if (Object.keys(errors).length || opening.value === undefined || inflows.value === undefined || outflows.value === undefined) {
    return { errors };
  }

  return {
    payload: {
      openingBalance: opening.value,
      monthlyInflows: inflows.value,
      monthlyOutflows: outflows.value,
      months,
    },
    errors,
  };
}

function isValidResponse(data: CashFlowResponse): boolean {
  return data.ok === true &&
    Array.isArray(data.rows) &&
    data.rows.length > 0 &&
    data.rows.every((row) =>
      Number.isFinite(row.month) &&
      Number.isFinite(row.inflow) &&
      Number.isFinite(row.outflow) &&
      Number.isFinite(row.net) &&
      Number.isFinite(row.closingBalance),
    ) &&
    Number.isFinite(data.openingBalance) &&
    Number.isFinite(data.closingBalance) &&
    Number.isFinite(data.lowestBalance) &&
    Number.isFinite(data.totalInflow) &&
    Number.isFinite(data.totalOutflow);
}

function CashFlowChart({ result }: { result: CashFlowResponse }) {
  const values = [result.openingBalance, ...result.rows.map((row) => row.closingBalance)];
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const spread = high - low || 1;
  const left = 92;
  const right = 778;
  const top = 20;
  const bottom = 278;
  const x = (index: number) => left + (index / (values.length - 1)) * (right - left);
  const y = (value: number) => bottom - ((value - low) / spread) * (bottom - top);
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const zeroY = y(0);
  const interval = Math.max(1, Math.ceil(result.rows.length / 5));
  const monthTicks = Array.from(new Set([
    0,
    ...Array.from({ length: Math.floor(result.rows.length / interval) }, (_, index) => (index + 1) * interval),
    result.rows.length,
  ]));
  const yTicks = Array.from({ length: 5 }, (_, index) => high - (spread * index) / 4);

  return (
    <div className="cash-flow-chart-wrap">
      <svg
        className="cash-flow-chart"
        viewBox="0 0 800 330"
        role="img"
        aria-labelledby="cash-flow-chart-title cash-flow-chart-description"
      >
        <title id="cash-flow-chart-title">Forecast closing cash balance by month</title>
        <desc id="cash-flow-chart-description">
          Line chart in INR showing the opening balance followed by the returned closing balance for each of {result.rows.length} forecast months.
        </desc>
        {yTicks.map((tick, index) => {
          const tickY = y(tick);
          return (
            <g key={index}>
              <line x1={left} x2={right} y1={tickY} y2={tickY} className="cash-flow-grid-line" />
              <text x={left - 10} y={tickY + 4} textAnchor="end" className="cash-flow-axis-label">
                {formatMoney(tick)}
              </text>
            </g>
          );
        })}
        <line x1={left} x2={right} y1={zeroY} y2={zeroY} className="cash-flow-zero-line" />
        <polyline points={points} className="cash-flow-line" />
        {monthTicks.map((month) => (
          <g key={month}>
            <line x1={x(month)} x2={x(month)} y1={bottom} y2={bottom + 5} className="cash-flow-tick-line" />
            <text x={x(month)} y={bottom + 21} textAnchor="middle" className="cash-flow-axis-label">
              {month === 0 ? 'Opening' : `M${month}`}
            </text>
          </g>
        ))}
        <text x={(left + right) / 2} y="324" textAnchor="middle" className="cash-flow-axis-title">Forecast month</text>
        <text transform={`translate(16 ${(top + bottom) / 2}) rotate(-90)`} textAnchor="middle" className="cash-flow-axis-title">
          Closing balance (INR)
        </text>
        <circle cx={x(values.length - 1)} cy={y(values[values.length - 1] ?? 0)} r="4.5" className="cash-flow-point" />
      </svg>
    </div>
  );
}

export function CashFlowPanel() {
  const user = useSession();
  const [input, setInput] = useState(INITIAL_INPUT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<CashFlowResponse | null>(null);
  const [requestError, setRequestError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultStale, setResultStale] = useState(false);
  const inputRevision = useRef(0);

  const update = (field: FieldName, value: string) => {
    inputRevision.current += 1;
    setResultStale(true);
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError('');
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseInput(input);
    setErrors(parsed.errors);
    setRequestError('');
    if (!parsed.payload) {
      if (result) setResultStale(true);
      return;
    }

    const requestRevision = inputRevision.current;
    setResultStale(true);
    setLoading(true);
    try {
      const data = await api<CashFlowResponse>('v1/finance/cash-flow', {
        method: 'POST',
        body: parsed.payload,
      });
      if (!isValidResponse(data)) {
        throw new Error('The forecast service returned an incomplete result. Please try again.');
      }
      setResult(data);
      setResultStale(inputRevision.current !== requestRevision);
    } catch (error) {
      setRequestError(errorMessage(error));
      if (result) setResultStale(true);
    } finally {
      setLoading(false);
    }
  }

  if (!can(user, 'finance:read')) {
    return (
      <p className="notice danger" role="alert">
        Access denied. Your role does not have permission to view cash-flow forecasts.
      </p>
    );
  }

  return (
    <div className="cash-flow-screen">
      <p className="notice cash-flow-source">
        <strong>Source:</strong> Your estimates entered here only. This forecast is not live Zoho data and does not read bank or ledger records.
      </p>

      <Section title="Forecast inputs">
        <form className="cash-flow-form" onSubmit={submit} noValidate>
          <div className="form-grid">
            <label className="field" htmlFor="cash-flow-opening">
              <span>Opening balance <span className="hint">· INR</span></span>
              <input
                id="cash-flow-opening"
                className="input"
                type="number"
                step="any"
                inputMode="decimal"
                value={input.openingBalance}
                onChange={(event) => update('openingBalance', event.target.value)}
                aria-invalid={Boolean(errors.openingBalance)}
                aria-describedby={errors.openingBalance ? 'cash-flow-opening-error' : undefined}
                required
              />
              {errors.openingBalance ? <span className="cash-flow-field-error" id="cash-flow-opening-error">{errors.openingBalance}</span> : null}
            </label>
            <label className="field" htmlFor="cash-flow-inflows">
              <span>Monthly inflows <span className="hint">· INR each month</span></span>
              <input
                id="cash-flow-inflows"
                className="input"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={input.monthlyInflows}
                onChange={(event) => update('monthlyInflows', event.target.value)}
                aria-invalid={Boolean(errors.monthlyInflows)}
                aria-describedby={errors.monthlyInflows ? 'cash-flow-inflows-error' : undefined}
                required
              />
              {errors.monthlyInflows ? <span className="cash-flow-field-error" id="cash-flow-inflows-error">{errors.monthlyInflows}</span> : null}
            </label>
            <label className="field" htmlFor="cash-flow-outflows">
              <span>Monthly outflows <span className="hint">· INR each month</span></span>
              <input
                id="cash-flow-outflows"
                className="input"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={input.monthlyOutflows}
                onChange={(event) => update('monthlyOutflows', event.target.value)}
                aria-invalid={Boolean(errors.monthlyOutflows)}
                aria-describedby={errors.monthlyOutflows ? 'cash-flow-outflows-error' : undefined}
                required
              />
              {errors.monthlyOutflows ? <span className="cash-flow-field-error" id="cash-flow-outflows-error">{errors.monthlyOutflows}</span> : null}
            </label>
            <label className="field" htmlFor="cash-flow-months">
              <span>Forecast horizon <span className="hint">· months, 1–120</span></span>
              <input
                id="cash-flow-months"
                className="input"
                type="number"
                min="1"
                max="120"
                step="1"
                inputMode="numeric"
                value={input.months}
                onChange={(event) => update('months', event.target.value)}
                aria-invalid={Boolean(errors.months)}
                aria-describedby={errors.months ? 'cash-flow-months-error' : undefined}
                required
              />
              {errors.months ? <span className="cash-flow-field-error" id="cash-flow-months-error">{errors.months}</span> : null}
            </label>
          </div>
          <p className="cash-flow-help">Monthly inflow and outflow amounts repeat for each forecast month. Use only figures you are comfortable sharing with this service.</p>
          <button className="button primary cash-flow-submit" type="submit" disabled={loading}>
            {loading ? 'Calculating forecast…' : 'Build forecast'}
          </button>
        </form>
      </Section>

      {loading ? <p className="notice" role="status" aria-live="polite">Calculating your forecast…</p> : null}
      {requestError ? <p className="notice danger" role="alert">{requestError}</p> : null}

      {result ? (
        <div className="cash-flow-results" aria-live="polite">
          {resultStale ? (
            <p className="notice warn" role="status">Stale forecast: these results reflect the last successful submission, not the current inputs. Build a new forecast to update them.</p>
          ) : (
            <p className="notice ok" role="status">Forecast calculated successfully from the values returned by the finance service.</p>
          )}
          <Section
            title="Forecast result"
            aside={<span className={`badge ${result.firstNegativeMonth == null ? 'ok' : 'warn'}`}>{result.status}</span>}
          >
            <p className="notice ok">
              <strong>Source:</strong> User-provided estimates — not live Zoho data.
            </p>
            <div className="cash-flow-summary">
              <article className="cash-flow-stat">
                <span>Closing balance <span>(INR)</span></span>
                <strong>{formatMoney(result.closingBalance)}</strong>
              </article>
              <article className="cash-flow-stat">
                <span>Lowest balance <span>(INR)</span></span>
                <strong>{formatMoney(result.lowestBalance)}</strong>
              </article>
              <article className="cash-flow-stat">
                <span>Total inflows <span>(INR)</span></span>
                <strong>{formatMoney(result.totalInflow)}</strong>
              </article>
              <article className="cash-flow-stat">
                <span>Total outflows <span>(INR)</span></span>
                <strong>{formatMoney(result.totalOutflow)}</strong>
              </article>
            </div>
            <p className="cash-flow-low-point">
              {result.lowestBalanceMonth === 0
                ? 'The lowest balance is the opening balance.'
                : `Lowest balance occurs in month ${result.lowestBalanceMonth}.`}
              {result.firstNegativeMonth != null ? ` First projected negative balance: month ${result.firstNegativeMonth}.` : ''}
            </p>
            <CashFlowChart result={result} />
            <p className="cash-flow-chart-caption">Closing cash balance in INR. Month 0 is the opening balance; later points are returned forecast balances.</p>
            <div className="cash-flow-disclaimer notice">
              <strong>Finance disclaimer:</strong> {result.investmentDisclaimer}
            </div>
            {result.assumptions.length ? (
              <div className="cash-flow-meta">
                <h3>Assumptions</h3>
                <ul>{result.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            ) : null}
            {result.limitations.length ? (
              <div className="cash-flow-meta">
                <h3>Limitations</h3>
                <ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            ) : null}
            <p className="cash-flow-calculation-source">Calculation: {result.source} · Confidence: {result.confidence}</p>
          </Section>

          <Section title="Month-by-month values">
            <div className="cash-flow-table-wrap">
              <table className="cash-flow-table">
                <caption>Returned forecast amounts, in INR</caption>
                <thead>
                  <tr><th scope="col">Month</th><th scope="col">Inflows (INR)</th><th scope="col">Outflows (INR)</th><th scope="col">Net (INR)</th><th scope="col">Closing balance (INR)</th></tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.month}>
                      <th scope="row">{row.month}</th>
                      <td>{formatMoney(row.inflow)}</td>
                      <td>{formatMoney(row.outflow)}</td>
                      <td>{formatMoney(row.net)}</td>
                      <td>{formatMoney(row.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
