'use client';

import { useState, type FormEvent } from 'react';
import { Badge, CheckboxField, InlineError, Notice, NumberField, SelectField, TextArea, TextField, Tabs } from './ui';
import { ResultView } from './result-view';
import { Icon } from './icons';
import { useSession, can } from './providers';
import { api, errorMessage } from '@/lib/api';

interface ExpenseRow {
  category: string;
  amount: string;
  essential: boolean;
}

interface DebtRow {
  name: string;
  balance: string;
  annualRatePercent: string;
  minimumPayment: string;
}

const TABS = [
  { id: 'budget', label: 'Budget plan' },
  { id: 'goal', label: 'Savings goal' },
  { id: 'cashflow', label: 'Cash flow' },
  { id: 'emi', label: 'Loan & EMI' },
  { id: 'emergency', label: 'Emergency fund' },
  { id: 'debt', label: 'Debt plan' },
];

const number = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const csv = (value: string): number[] =>
  value.split(',').map((part) => Number(part.trim())).filter((entry) => Number.isFinite(entry));

export function MoneyPanel() {
  const user = useSession();
  const allowed = can(user, 'money:read');
  const [tab, setTab] = useState('budget');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  const [income, setIncome] = useState('100000');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { category: 'Rent', amount: '25000', essential: true },
    { category: 'Food', amount: '15000', essential: true },
  ]);
  const [debtPayments, setDebtPayments] = useState('0');
  const [savingsGoal, setSavingsGoal] = useState('20000');
  const [liquid, setLiquid] = useState('300000');

  const [target, setTarget] = useState('1000000');
  const [currentSavings, setCurrentSavings] = useState('100000');
  const [monthlyContribution, setMonthlyContribution] = useState('20000');
  const [annualReturn, setAnnualReturn] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const [opening, setOpening] = useState('500000');
  const [inflows, setInflows] = useState('300000, 320000, 340000');
  const [outflows, setOutflows] = useState('280000, 290000, 310000');
  const [months, setMonths] = useState('12');

  const [principal, setPrincipal] = useState('1000000');
  const [annualRate, setAnnualRate] = useState('9');
  const [term, setTerm] = useState('120');
  const [schedule, setSchedule] = useState(false);

  const [essential, setEssential] = useState('40000');
  const [targetMonths, setTargetMonths] = useState('6');
  const [emergencySaved, setEmergencySaved] = useState('100000');
  const [emergencyMonthly, setEmergencyMonthly] = useState('15000');

  const [debts, setDebts] = useState<DebtRow[]>([
    { name: 'Card', balance: '80000', annualRatePercent: '36', minimumPayment: '4000' },
  ]);
  const [extraPayment, setExtraPayment] = useState('5000');

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

  function submitBudget(event: FormEvent) {
    event.preventDefault();
    void run('v1/money/plan', {
      monthlyIncome: number(income),
      expenses: expenses
        .filter((row) => row.category.trim() && number(row.amount) !== undefined)
        .map((row) => ({ category: row.category.trim(), amount: number(row.amount), essential: row.essential })),
      debtPayments: number(debtPayments) ?? 0,
      savingsGoal: number(savingsGoal) ?? 0,
      liquidSavings: number(liquid) ?? 0,
    });
  }

  function submitGoal(event: FormEvent) {
    event.preventDefault();
    void run('v1/money/goal', {
      targetAmount: number(target),
      currentSavings: number(currentSavings) ?? 0,
      monthlyContribution: number(monthlyContribution) ?? 0,
      annualReturnPercent: annualReturn.trim() ? number(annualReturn) : null,
      ...(targetDate ? { targetDate } : {}),
    });
  }

  function submitCashFlow(event: FormEvent) {
    event.preventDefault();
    const inflowSeries = csv(inflows);
    const outflowSeries = csv(outflows);
    void run('v1/finance/cash-flow', {
      openingBalance: number(opening) ?? 0,
      monthlyInflows: inflowSeries.length === 1 ? (inflowSeries[0] as number) : inflowSeries,
      monthlyOutflows: outflowSeries.length === 1 ? (outflowSeries[0] as number) : outflowSeries,
      ...(months.trim() ? { months: number(months) } : {}),
    });
  }

  function submitEmi(event: FormEvent) {
    event.preventDefault();
    void run('v1/finance/emi', {
      principal: number(principal),
      annualRatePercent: number(annualRate) ?? 0,
      months: number(term),
      includeSchedule: schedule,
    });
  }

  function submitEmergency(event: FormEvent) {
    event.preventDefault();
    void run('v1/finance/emergency-fund', {
      monthlyEssentialExpenses: number(essential),
      targetMonths: number(targetMonths) ?? 6,
      currentSavings: number(emergencySaved) ?? 0,
      monthlyContribution: number(emergencyMonthly) ?? 0,
    });
  }

  function submitDebt(event: FormEvent) {
    event.preventDefault();
    void run('v1/finance/debt-plan', {
      debts: debts
        .filter((row) => number(row.balance) !== undefined)
        .map((row) => ({
          name: row.name.trim() || undefined,
          balance: number(row.balance),
          annualRatePercent: number(row.annualRatePercent) ?? 0,
          minimumPayment: number(row.minimumPayment) ?? 0,
        })),
      extraPayment: number(extraPayment) ?? 0,
    });
  }

  if (!allowed) {
    return (
      <Notice tone="warn" title="Money Mode is not available for your role.">
        Ask an owner to grant <span className="mono">money:read</span> if you need these planning tools. No financial data is shown.
      </Notice>
    );
  }

  return (
    <div className="stack">
      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Money tools" />

      <div className="panel">
        {tab === 'budget' ? (
          <form className="stack" onSubmit={submitBudget}>
            <div className="form-grid">
              <NumberField label="Monthly income" value={income} onChange={setIncome} min={1} required />
              <NumberField label="Monthly debt payments" value={debtPayments} onChange={setDebtPayments} min={0} />
              <NumberField label="Monthly savings goal" value={savingsGoal} onChange={setSavingsGoal} min={0} />
              <NumberField label="Liquid savings" value={liquid} onChange={setLiquid} min={0} hint="cash and bank balance you can use" />
            </div>
            <div className="stack-sm">
              <div className="row-between">
                <strong style={{ fontSize: '0.9rem' }}>Expenses</strong>
                <button className="button small ghost" type="button" onClick={() => setExpenses([...expenses, { category: '', amount: '', essential: true }])}>
                  <Icon name="plus" size={14} /> Add expense
                </button>
              </div>
              {expenses.map((row, index) => (
                <div key={index} className="form-grid" style={{ alignItems: 'end' }}>
                  <TextField label="Category" value={row.category} onChange={(value) => setExpenses(expenses.map((item, i) => i === index ? { ...item, category: value } : item))} />
                  <div className="row" style={{ alignItems: 'end' }}>
                    <NumberField label="Amount" value={row.amount} onChange={(value) => setExpenses(expenses.map((item, i) => i === index ? { ...item, amount: value } : item))} min={0} />
                    <button className="icon-button" type="button" aria-label="Remove expense" onClick={() => setExpenses(expenses.filter((_, i) => i !== index))} style={{ marginBottom: '0.15rem' }}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <CheckboxField label="Essential" checked={row.essential} onChange={(value) => setExpenses(expenses.map((item, i) => i === index ? { ...item, essential: value } : item))} />
                </div>
              ))}
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Build plan</button>
              <Badge>deterministic arithmetic</Badge>
            </div>
          </form>
        ) : null}

        {tab === 'goal' ? (
          <form className="stack" onSubmit={submitGoal}>
            <div className="form-grid">
              <NumberField label="Target amount" value={target} onChange={setTarget} min={1} required />
              <NumberField label="Current savings" value={currentSavings} onChange={setCurrentSavings} min={0} />
              <NumberField label="Monthly contribution" value={monthlyContribution} onChange={setMonthlyContribution} min={0} />
              <NumberField label="Assumed annual return %" value={annualReturn} onChange={setAnnualReturn} hint="optional; leave blank for no return" />
              <TextField label="Target date" type="date" value={targetDate} onChange={setTargetDate} hint="optional" />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Plan goal</button>
              <span className="fineprint">A return is a scenario, never a promise.</span>
            </div>
          </form>
        ) : null}

        {tab === 'cashflow' ? (
          <form className="stack" onSubmit={submitCashFlow}>
            <div className="form-grid">
              <NumberField label="Opening balance" value={opening} onChange={setOpening} />
              <NumberField label="Months" value={months} onChange={setMonths} min={1} max={120} step={1} />
              <TextArea label="Monthly inflows" value={inflows} onChange={setInflows} hint="comma-separated; last value repeats" rows={2} />
              <TextArea label="Monthly outflows" value={outflows} onChange={setOutflows} hint="comma-separated; last value repeats" rows={2} />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Forecast</button>
              <span className="fineprint">A plan is not a guarantee. Reconcile with bank and ledger records.</span>
            </div>
          </form>
        ) : null}

        {tab === 'emi' ? (
          <form className="stack" onSubmit={submitEmi}>
            <div className="form-grid">
              <NumberField label="Principal" value={principal} onChange={setPrincipal} min={1} required />
              <NumberField label="Annual interest rate %" value={annualRate} onChange={setAnnualRate} min={0} max={100} />
              <NumberField label="Months" value={term} onChange={setTerm} min={1} max={600} step={1} required />
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.4rem' }}>
                <CheckboxField label="Include repayment schedule" checked={schedule} onChange={setSchedule} />
              </div>
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Calculate EMI</button>
              <span className="fineprint">No processing fee, insurance or floating-rate change is modelled.</span>
            </div>
          </form>
        ) : null}

        {tab === 'emergency' ? (
          <form className="stack" onSubmit={submitEmergency}>
            <div className="form-grid">
              <NumberField label="Monthly essential expenses" value={essential} onChange={setEssential} min={1} required />
              <NumberField label="Target months" value={targetMonths} onChange={setTargetMonths} min={1} max={36} />
              <NumberField label="Current emergency savings" value={emergencySaved} onChange={setEmergencySaved} min={0} />
              <NumberField label="Monthly contribution" value={emergencyMonthly} onChange={setEmergencyMonthly} min={0} />
            </div>
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Plan buffer</button>
              <span className="fineprint">A common starting point is three to six months of essentials, not a universal rule.</span>
            </div>
          </form>
        ) : null}

        {tab === 'debt' ? (
          <form className="stack" onSubmit={submitDebt}>
            <div className="stack-sm">
              <div className="row-between">
                <strong style={{ fontSize: '0.9rem' }}>Debts</strong>
                <button className="button small ghost" type="button" onClick={() => setDebts([...debts, { name: '', balance: '', annualRatePercent: '', minimumPayment: '' }])}>
                  <Icon name="plus" size={14} /> Add debt
                </button>
              </div>
              {debts.map((row, index) => (
                <div key={index} className="form-grid" style={{ alignItems: 'end' }}>
                  <TextField label="Name" value={row.name} onChange={(value) => setDebts(debts.map((item, i) => i === index ? { ...item, name: value } : item))} />
                  <NumberField label="Balance" value={row.balance} onChange={(value) => setDebts(debts.map((item, i) => i === index ? { ...item, balance: value } : item))} min={1} />
                  <NumberField label="Annual rate %" value={row.annualRatePercent} onChange={(value) => setDebts(debts.map((item, i) => i === index ? { ...item, annualRatePercent: value } : item))} min={0} max={100} />
                  <div className="row" style={{ alignItems: 'end' }}>
                    <NumberField label="Minimum payment" value={row.minimumPayment} onChange={(value) => setDebts(debts.map((item, i) => i === index ? { ...item, minimumPayment: value } : item))} min={0} />
                    <button className="icon-button" type="button" aria-label="Remove debt" onClick={() => setDebts(debts.filter((_, i) => i !== index))} style={{ marginBottom: '0.15rem' }}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <NumberField label="Extra monthly payment" value={extraPayment} onChange={setExtraPayment} min={0} />
            <div className="row">
              <button className="button primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : null} Build debt plan</button>
              <span className="fineprint">This compares repayment orders; it does not negotiate with a lender.</span>
            </div>
          </form>
        ) : null}
      </div>

      {error ? <InlineError message={error} /> : null}
      {result ? <ResultView data={result} title="Result" /> : null}
      {result ? null : (
        <Notice tone="info" title="How this works:">
          Every number is supplied by you. Flux calculates deterministically and shows its assumptions. It does not fetch live rates or recommend a financial product.
        </Notice>
      )}
    </div>
  );
}
