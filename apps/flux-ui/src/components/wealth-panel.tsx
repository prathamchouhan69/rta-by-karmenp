'use client';

import { useState, type FormEvent } from 'react';
import { Badge, InlineError, Notice, NumberField, SelectField, TextField, Tabs } from './ui';
import { ResultView } from './result-view';
import { Icon } from './icons';
import { useSession, can } from './providers';
import { api, errorMessage } from '@/lib/api';

interface AssetRow { name: string; class: string; value: string }
interface LiabilityRow { name: string; class: string; value: string; interestRatePercent: string }

const TABS = [
  { id: 'networth', label: 'Net worth' },
  { id: 'compound', label: 'Compound scenario' },
  { id: 'retirement', label: 'Retirement gap' },
];

const ASSET_CLASSES = [
  { value: 'cash', label: 'Cash & bank' },
  { value: 'fixed_deposit', label: 'Fixed deposit' },
  { value: 'debt', label: 'Debt fund' },
  { value: 'equity', label: 'Equity' },
  { value: 'real_estate', label: 'Real estate' },
  { value: 'gold', label: 'Gold' },
  { value: 'business', label: 'Business' },
  { value: 'retirement', label: 'Retirement account' },
  { value: 'other', label: 'Other' },
];

const LIABILITY_CLASSES = [
  { value: 'home_loan', label: 'Home loan' },
  { value: 'vehicle_loan', label: 'Vehicle loan' },
  { value: 'personal_loan', label: 'Personal loan' },
  { value: 'business_loan', label: 'Business loan' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'tax', label: 'Tax due' },
  { value: 'other', label: 'Other' },
];

const number = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function WealthPanel() {
  const user = useSession();
  const allowed = can(user, 'wealth:read');
  const [tab, setTab] = useState('networth');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  const [assets, setAssets] = useState<AssetRow[]>([
    { name: 'Bank', class: 'cash', value: '500000' },
    { name: 'Equity fund', class: 'equity', value: '300000' },
  ]);
  const [liabilities, setLiabilities] = useState<LiabilityRow[]>([
    { name: 'Home loan', class: 'home_loan', value: '400000', interestRatePercent: '8.5' },
  ]);
  const [asOf, setAsOf] = useState('');

  const [principal, setPrincipal] = useState('100000');
  const [monthly, setMonthly] = useState('10000');
  const [rate, setRate] = useState('10');
  const [years, setYears] = useState('10');
  const [inflation, setInflation] = useState('6');

  const [age, setAge] = useState('30');
  const [retireAge, setRetireAge] = useState('60');
  const [life, setLife] = useState('85');
  const [expenses, setExpenses] = useState('50000');
  const [retireInflation, setRetireInflation] = useState('6');
  const [preReturn, setPreReturn] = useState('10');
  const [postReturn, setPostReturn] = useState('7');
  const [corpus, setCorpus] = useState('500000');
  const [retireMonthly, setRetireMonthly] = useState('20000');

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

  function submitNetWorth(event: FormEvent) {
    event.preventDefault();
    void run('v1/wealth/net-worth', {
      assets: assets.filter((row) => number(row.value) !== undefined).map((row) => ({ name: row.name.trim() || undefined, class: row.class, value: number(row.value) })),
      liabilities: liabilities.filter((row) => number(row.value) !== undefined).map((row) => ({
        name: row.name.trim() || undefined,
        class: row.class,
        value: number(row.value),
        interestRatePercent: number(row.interestRatePercent),
      })),
      ...(asOf ? { asOf } : {}),
    });
  }

  function submitCompound(event: FormEvent) {
    event.preventDefault();
    void run('v1/wealth/compound', {
      principal: number(principal) ?? 0,
      monthlyContribution: number(monthly) ?? 0,
      annualRatePercent: number(rate),
      years: number(years),
      inflationPercent: number(inflation) ?? 0,
    });
  }

  function submitRetirement(event: FormEvent) {
    event.preventDefault();
    void run('v1/wealth/retirement-gap', {
      currentAge: number(age),
      retirementAge: number(retireAge),
      lifeExpectancy: number(life) ?? 85,
      monthlyExpensesToday: number(expenses),
      inflationPercent: number(retireInflation),
      preRetirementReturnPercent: number(preReturn),
      postRetirementReturnPercent: number(postReturn),
      currentCorpus: number(corpus) ?? 0,
      monthlyContribution: number(retireMonthly) ?? 0,
    });
  }

  if (!allowed) {
    return (
      <Notice tone="warn" title="Wealth Mode is not available for your role.">
        Ask an owner to grant <span className="mono">wealth:read</span> if you need these planning tools.
      </Notice>
    );
  }

  return (
    <div className="stack">
      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Wealth tools" />

      <div className="panel">
        {tab === 'networth' ? (
          <form className="stack" onSubmit={submitNetWorth}>
            <div className="stack-sm">
              <div className="row-between">
                <strong style={{ fontSize: '0.9rem' }}>Assets</strong>
                <button className="button small ghost" type="button" onClick={() => setAssets([...assets, { name: '', class: 'cash', value: '' }])}>
                  <Icon name="plus" size={14} /> Add asset
                </button>
              </div>
              {assets.map((row, index) => (
                <div key={index} className="form-grid" style={{ alignItems: 'end' }}>
                  <TextField label="Name" value={row.name} onChange={(value) => setAssets(assets.map((item, i) => i === index ? { ...item, name: value } : item))} />
                  <SelectField label="Class" value={row.class} onChange={(value) => setAssets(assets.map((item, i) => i === index ? { ...item, class: value } : item))} options={ASSET_CLASSES} />
                  <div className="row" style={{ alignItems: 'end' }}>
                    <NumberField label="Value" value={row.value} onChange={(value) => setAssets(assets.map((item, i) => i === index ? { ...item, value } : item))} min={0} />
                    <button className="icon-button" type="button" aria-label="Remove asset" onClick={() => setAssets(assets.filter((_, i) => i !== index))} style={{ marginBottom: '0.15rem' }}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="stack-sm">
              <div className="row-between">
                <strong style={{ fontSize: '0.9rem' }}>Liabilities</strong>
                <button className="button small ghost" type="button" onClick={() => setLiabilities([...liabilities, { name: '', class: 'personal_loan', value: '', interestRatePercent: '' }])}>
                  <Icon name="plus" size={14} /> Add liability
                </button>
              </div>
              {liabilities.map((row, index) => (
                <div key={index} className="form-grid" style={{ alignItems: 'end' }}>
                  <TextField label="Name" value={row.name} onChange={(value) => setLiabilities(liabilities.map((item, i) => i === index ? { ...item, name: value } : item))} />
                  <SelectField label="Class" value={row.class} onChange={(value) => setLiabilities(liabilities.map((item, i) => i === index ? { ...item, class: value } : item))} options={LIABILITY_CLASSES} />
                  <NumberField label="Outstanding value" value={row.value} onChange={(value) => setLiabilities(liabilities.map((item, i) => i === index ? { ...item, value } : item))} min={0} />
                  <div className="row" style={{ alignItems: 'end' }}>
                    <NumberField label="Interest rate %" value={row.interestRatePercent} onChange={(value) => setLiabilities(liabilities.map((item, i) => i === index ? { ...item, interestRatePercent: value } : item))} min={0} max={100} hint="optional" />
                    <button className="icon-button" type="button" aria-label="Remove liability" onClick={() => setLiabilities(liabilities.filter((_, i) => i !== index))} style={{ marginBottom: '0.15rem' }}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-grid">
              <TextField label="Snapshot date" type="date" value={asOf} onChange={setAsOf} hint="optional" />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Build balance sheet</button>
              <Badge>values are yours, not verified</Badge>
            </div>
          </form>
        ) : null}

        {tab === 'compound' ? (
          <form className="stack" onSubmit={submitCompound}>
            <div className="form-grid">
              <NumberField label="Starting principal" value={principal} onChange={setPrincipal} min={0} />
              <NumberField label="Monthly contribution" value={monthly} onChange={setMonthly} min={0} />
              <NumberField label="Assumed annual return %" value={rate} onChange={setRate} min={-99} max={100} required />
              <NumberField label="Years" value={years} onChange={setYears} min={0.1} max={80} required />
              <NumberField label="Inflation %" value={inflation} onChange={setInflation} min={-50} max={100} hint="used for today's purchasing power" />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Run scenario</button>
              <span className="fineprint">A positive return is an assumption. Real returns can be negative.</span>
            </div>
          </form>
        ) : null}

        {tab === 'retirement' ? (
          <form className="stack" onSubmit={submitRetirement}>
            <div className="form-grid">
              <NumberField label="Current age" value={age} onChange={setAge} min={15} max={100} required />
              <NumberField label="Retirement age" value={retireAge} onChange={setRetireAge} min={16} max={100} required />
              <NumberField label="Life expectancy" value={life} onChange={setLife} min={30} max={120} />
              <NumberField label="Monthly expenses today" value={expenses} onChange={setExpenses} min={1} required />
              <NumberField label="Inflation %" value={retireInflation} onChange={setRetireInflation} min={-50} max={100} required />
              <NumberField label="Pre-retirement return %" value={preReturn} onChange={setPreReturn} min={-99} max={100} required />
              <NumberField label="Post-retirement return %" value={postReturn} onChange={setPostReturn} min={-99} max={100} required />
              <NumberField label="Current corpus" value={corpus} onChange={setCorpus} min={0} />
              <NumberField label="Monthly contribution" value={retireMonthly} onChange={setRetireMonthly} min={0} />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Find the gap</button>
              <span className="fineprint">No pension, rent, inheritance, tax or healthcare shock is modelled.</span>
            </div>
          </form>
        ) : null}
      </div>

      {error ? <InlineError message={error} /> : null}
      {result ? <ResultView data={result} title="Scenario result" /> : <Notice tone="info" title="Assumptions stay visible:">Flux uses only the rates and values you enter. It does not forecast a market.</Notice>}
    </div>
  );
}
