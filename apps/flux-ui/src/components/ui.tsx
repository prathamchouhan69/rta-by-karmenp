'use client';

import type { ReactNode, SelectHTMLAttributes } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="row-between">
        <div className="stack-sm">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
        </div>
        {actions ? <div className="row">{actions}</div> : null}
      </div>
      {description ? <div className="lede">{description}</div> : null}
    </header>
  );
}

export function Section({
  title,
  aside,
  children,
  id,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="section" id={id} aria-label={title}>
      <div className="section-head">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span>
        {label}
        {hint ? <span className="hint"> · {hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = 'text',
  required,
  minLength,
  maxLength,
  inputMode,
  autoComplete,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'url' | 'email' | 'password';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'email' | 'tel';
  autoComplete?: string;
  id?: string;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        className="input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  min,
  max,
  step = 'any',
  required,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | 'any';
  required?: boolean;
  id?: string;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        className="input"
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  placeholder,
  rows = 4,
  maxLength,
  required,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  id?: string;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        className="textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  id,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  id?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'id'>) {
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Notice({
  children,
  tone = 'info',
  title,
}: {
  children: ReactNode;
  tone?: 'info' | 'danger' | 'warn' | 'ok';
  title?: string;
}) {
  return (
    <div className={`notice${tone === 'info' ? '' : ` ${tone}`}`} role={tone === 'danger' ? 'alert' : undefined}>
      {title ? <strong>{title} </strong> : null}
      {children}
    </div>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: 'ok' | 'warn' | 'danger' | 'accent' }) {
  return <span className={`badge${tone ? ` ${tone}` : ''}`}>{children}</span>;
}

export function Stat({ label, value, small }: { label: string; value: ReactNode; small?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${small ? ' small' : ''}`}>{value}</div>
    </div>
  );
}

export function LoadingRow({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-row" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children ? <div className="muted">{children}</div> : null}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  label = 'Sections',
}: {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return <p className="disclaimer">{children}</p>;
}

export function InlineError({ message }: { message: string }) {
  return (
    <p className="notice danger" role="alert">
      {message}
    </p>
  );
}
