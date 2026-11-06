'use client';

import { useState, type FormEvent } from 'react';
import { Badge, InlineError, Notice, NumberField, Tabs } from './ui';
import { ResultView } from './result-view';
import { useSession, can } from './providers';
import { api, errorMessage } from '@/lib/api';

const TABS = [
  { id: 'snapshot', label: 'Founder snapshot' },
  { id: 'runway', label: 'Runway' },
  { id: 'burn', label: 'Burn multiple' },
  { id: 'dilution', label: 'Dilution' },
];

const number = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function StartupPanel() {
  const user = useSession();
  const allowed = can(user, 'startup:read');
  const [tab, setTab] = useState('snapshot');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  const [cash, setCash] = useState('1000000');
  const [revenue, setRevenue] = useState('200000');
  const [expenses, setExpenses] = useState('300000');
  const [growth, setGrowth] = useState('0');
  const [price, setPrice] = useState('5000');
  const [variable, setVariable] = useState('3000');
  const [cac, setCac] = useState('10000');
  const [lifetime, setLifetime] = useState('12');
  const [fixed, setFixed] = useState('50000');
  const [emi, setEmi] = useState('0');

  const [runwayMonths, setRunwayMonths] = useState('36');
  const [burn, setBurn] = useState('500000');
  const [newRevenue, setNewRevenue] = useState('400000');
  const [period, setPeriod] = useState('12');
  const [preMoney, setPreMoney] = useState('40000000');
  const [investment, setInvestment] = useState('10000000');
  const [pool, setPool] = useState('10');
  const [existing, setExisting] = useState('0');

  async function run(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    try {
      setResult(await api(path, { method: 'POST', body }));
    } catch (issue) {
      setError(errorMessage(issue));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  function submitSnapshot(event: FormEvent) {
    event.preventDefault();
    void run('v1/startup/snapshot', {
      cashBalance: number(cash) ?? 0,
      monthlyRevenue: number(revenue) ?? 0,
      monthlyExpenses: number(expenses),
      monthlyRevenueGrowthPercent: number(growth) ?? 0,
      pricePerUnit: number(price),
      variableCostPerUnit: number(variable) ?? 0,
      customerAcquisitionCost: number(cac) ?? 0,
      lifetimeMonths: number(lifetime) ?? 12,
      fixedCosts: number(fixed) ?? 0,
      existingMonthlyEmi: number(emi) ?? 0,
    });
  }

  function submitRunway(event: FormEvent) {
    event.preventDefault();
    void run('v1/startup/runway', {
      cashBalance: number(cash) ?? 0,
      monthlyRevenue: number(revenue) ?? 0,
      monthlyExpenses: number(expenses),
      monthlyRevenueGrowthPercent: number(growth) ?? 0,
      months: number(runwayMonths) ?? 36,
    });
  }

  function submitBurn(event: FormEvent) {
    event.preventDefault();
    void run('v1/startup/burn-multiple', {
      netBurn: number(burn),
      netNewRevenue: number(newRevenue) ?? 0,
      periodMonths: number(period) ?? 12,
    });
  }

  function submitDilution(event: FormEvent) {
    event.preventDefault();
    void run('v1/startup/dilution', {
      preMoneyValuation: number(preMoney),
      investmentAmount: number(investment),
      optionPoolPercent: number(pool) ?? 0,
      existingInvestorPercent: number(existing) ?? 0,
    });
  }

  if (!allowed) {
    return (
      <Notice tone="warn" title="Startup Founder Mode is not available for your role.">
        Ask an owner to grant <span className="mono">startup:read</span> if you need these planning tools.
      </Notice>
    );
  }

  return (
    <div className="stack">
      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Startup tools" />

      <div className="panel">
        {tab === 'snapshot' ? (
          <form className="stack" onSubmit={submitSnapshot}>
            <div className="form-grid">
              <NumberField label="Cash balance" value={cash} onChange={setCash} min={0} required />
              <NumberField label="Monthly revenue" value={revenue} onChange={setRevenue} min={0} />
              <NumberField label="Monthly expenses" value={expenses} onChange={setExpenses} min={1} required />
              <NumberField label="Monthly revenue growth %" value={growth} onChange={setGrowth} min={-100} max={500} />
              <NumberField label="Price per unit" value={price} onChange={setPrice} min={1} required />
              <NumberField label="Variable cost per unit" value={variable} onChange={setVariable} min={0} />
              <NumberField label="Customer acquisition cost" value={cac} onChange={setCac} min={0} />
              <NumberField label="Customer lifetime (months)" value={lifetime} onChange={setLifetime} min={1} max={600} />
              <NumberField label="Fixed costs per month" value={fixed} onChange={setFixed} min={0} />
              <NumberField label="Existing monthly EMI" value={emi} onChange={setEmi} min={0} />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Build snapshot</button>
              <Badge>not a valuation</Badge>
            </div>
          </form>
        ) : null}

        {tab === 'runway' ? (
          <form className="stack" onSubmit={submitRunway}>
            <div className="form-grid">
              <NumberField label="Cash balance" value={cash} onChange={setCash} min={0} required />
              <NumberField label="Monthly revenue" value={revenue} onChange={setRevenue} min={0} />
              <NumberField label="Monthly expenses" value={expenses} onChange={setExpenses} min={1} required />
              <NumberField label="Monthly revenue growth %" value={growth} onChange={setGrowth} min={-100} max={500} />
              <NumberField label="Projection months" value={runwayMonths} onChange={setRunwayMonths} min={1} max={120} step={1} />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Project runway</button>
              <span className="fineprint">Collections timing can make the real low point earlier.</span>
            </div>
          </form>
        ) : null}

        {tab === 'burn' ? (
          <form className="stack" onSubmit={submitBurn}>
            <div className="form-grid">
              <NumberField label="Net burn" value={burn} onChange={setBurn} min={1} required />
              <NumberField label="Net new revenue" value={newRevenue} onChange={setNewRevenue} min={0} />
              <NumberField label="Period (months)" value={period} onChange={setPeriod} min={1} max={120} step={1} />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Calculate burn multiple</button>
              <span className="fineprint">Both figures must cover the same period and accounting basis.</span>
            </div>
          </form>
        ) : null}

        {tab === 'dilution' ? (
          <form className="stack" onSubmit={submitDilution}>
            <div className="form-grid">
              <NumberField label="Pre-money valuation" value={preMoney} onChange={setPreMoney} min={1} required />
              <NumberField label="Investment amount" value={investment} onChange={setInvestment} min={1} required />
              <NumberField label="Option pool %" value={pool} onChange={setPool} min={0} max={100} />
              <NumberField label="Existing investor %" value={existing} onChange={setExisting} min={0} max={100} />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Calculate ownership</button>
              <span className="fineprint">No convertible notes, SAFE, liquidation preference or tranche is modelled.</span>
            </div>
          </form>
        ) : null}
      </div>

      {error ? <InlineError message={error} /> : null}
      {result ? <ResultView data={result} title="Founder result" /> : <Notice tone="info" title="Not a fundraising promise:">Runway and cap-table arithmetic depend entirely on your inputs. Validate them with your accountant and lawyer before a real round.</Notice>}
    </div>
  );
}
