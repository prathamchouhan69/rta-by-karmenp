import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiGet, apiWrite, makeIdempotencyKey, type ZohoRecord } from "./api";

type GoalInput = ZohoRecord & {
  title: string;
  metric: string;
  unit: string;
  baseline: string;
  currentValue: string;
  minimumTarget: string;
  target: string;
  stretchTarget: string;
  baselineDate: string;
  currentDate: string;
  deadline: string;
  owner: string;
  capacityPerWeek?: string;
};

type Goal = GoalInput & {
  goal_id: string;
  status: "needs_inputs" | "on_track" | "at_risk" | "behind" | "completed";
  progressPercent: number;
  daysRemaining: number;
  requiredDailyPace: string;
  requiredWeeklyPace: string;
  projectedAtDeadline: string;
  capacitySufficient: boolean;
  missingInputs: string[];
  risks: string[];
  dailyActions: { title: string; owner: string; deadline: string; expectedOutcome: string; priority: string; reason: string }[];
  weeklyMilestones: { date: string; targetValue: string; owner: string; expectedOutcome: string }[];
  monthlyOutcomes: { date: string; targetValue: string; owner: string; expectedOutcome: string }[];
  quarterlyObjectives: { date: string; targetValue: string; owner: string; expectedOutcome: string }[];
};
type GoalText = { risks: string; forecast: string; needed: string; perWeek: string };

const metrics = [
  ["monthly_revenue", "Monthly revenue", "INR"],
  ["profit_margin", "Profit margin", "%"],
  ["collections", "Collections", "INR"],
  ["overdue_recovery", "Overdue recovery", "INR"],
  ["leads", "New leads", "count"],
  ["quotations", "Quotations sent", "count"],
  ["quotation_conversion", "Quotation conversion", "%"],
  ["new_customers", "New customers", "count"],
  ["projects_completed", "Projects completed", "count"],
  ["delivery_milestones", "Delivery milestones", "count"],
  ["material_cost_control", "Material cost control", "INR"],
  ["inventory_reduction", "Inventory reduction", "count"],
  ["vendor_payments", "Vendor payments", "INR"],
  ["team_productivity", "Team productivity", "%"],
  ["marketing_growth", "Marketing growth", "%"],
  ["tender_submissions", "Tender submissions", "count"],
  ["business_expansion", "Business expansion", "count"],
] as const;

const translations = {
  en: {
    title: "Goals & Execution",
    description: "Set a measurable target, check its feasibility, and keep the plan tied to your actuals.",
    language: "Language",
    newGoal: "New goal",
    createTitle: "Create a business goal",
    goalName: "Goal name",
    metric: "Measure",
    baseline: "Baseline actual",
    current: "Current actual",
    minimum: "Minimum acceptable",
    target: "Target",
    stretch: "Stretch target",
    baselineDate: "Baseline date",
    currentDate: "Current actual date",
    deadline: "Deadline",
    owner: "Owner",
    capacity: "Available weekly capacity",
    capacityHint: "Enter the amount this team can realistically deliver each week. Feasibility stays uncertain if it is missing.",
    preview: "Check feasibility",
    save: "Save goal",
    cancel: "Cancel",
    loading: "Loading goals…",
    empty: "No goals yet",
    emptyDetail: "Create a goal using verified actuals and a clear owner.",
    progress: "Progress",
    needed: "Required pace",
    perDay: "per day",
    perWeek: "per week",
    forecast: "Trend projection",
    actual: "Record actual",
    actualValue: "Actual value",
    date: "Actual date",
    saveActual: "Update progress",
    risks: "Risks and missing inputs",
    priorities: "Today's action",
    milestones: "Weekly milestones",
    monthly: "Monthly outcomes",
    quarterly: "Quarterly objectives",
    noForecast: "A historical forecast needs dated actuals at least seven days apart.",
    sourceNote: "Plans use the values you provide. No external market or financial facts are inferred.",
    error: "Could not load or save goals.",
    saved: "Goal saved.",
    updated: "Progress updated.",
    evidence: "Use source-verified figures. Missing data will be called out, not estimated.",
    paceDetail: "Compare verified actuals with the required pace",
    days: "days",
  },
  hi: {
    title: "लक्ष्य और क्रियान्वयन",
    description: "मापने योग्य लक्ष्य तय करें, उसकी व्यवहार्यता जाँचें और योजना को वास्तविक आँकड़ों से जोड़ें।",
    language: "भाषा",
    newGoal: "नया लक्ष्य",
    createTitle: "व्यावसायिक लक्ष्य बनाएँ",
    goalName: "लक्ष्य का नाम",
    metric: "माप",
    baseline: "आधार वास्तविक आँकड़ा",
    current: "वर्तमान वास्तविक आँकड़ा",
    minimum: "न्यूनतम स्वीकार्य",
    target: "लक्ष्य",
    stretch: "विस्तारित लक्ष्य",
    baselineDate: "आधार तिथि",
    currentDate: "वर्तमान आँकड़े की तिथि",
    deadline: "अंतिम तिथि",
    owner: "ज़िम्मेदार व्यक्ति",
    capacity: "साप्ताहिक उपलब्ध क्षमता",
    capacityHint: "टीम की वास्तविक साप्ताहिक क्षमता दर्ज करें। क्षमता न होने पर व्यवहार्यता अनिश्चित रहेगी।",
    preview: "व्यवहार्यता जाँचें",
    save: "लक्ष्य सहेजें",
    cancel: "रद्द करें",
    loading: "लक्ष्य लोड हो रहे हैं…",
    empty: "अभी कोई लक्ष्य नहीं",
    emptyDetail: "सत्यापित आँकड़ों और स्पष्ट ज़िम्मेदार व्यक्ति के साथ लक्ष्य बनाएँ।",
    progress: "प्रगति",
    needed: "आवश्यक गति",
    perDay: "प्रतिदिन",
    perWeek: "प्रति सप्ताह",
    forecast: "रुझान अनुमान",
    actual: "वास्तविक आँकड़ा दर्ज करें",
    actualValue: "वास्तविक मान",
    date: "आँकड़े की तिथि",
    saveActual: "प्रगति अपडेट करें",
    risks: "जोखिम और अधूरी जानकारी",
    priorities: "आज की कार्रवाई",
    milestones: "साप्ताहिक पड़ाव",
    monthly: "मासिक परिणाम",
    quarterly: "तिमाही उद्देश्य",
    noForecast: "रुझान के अनुमान के लिए कम-से-कम सात दिन के अंतर वाले वास्तविक आँकड़े चाहिए।",
    sourceNote: "योजना आपके दिए गए मानों का उपयोग करती है। बाहरी बाज़ार या वित्तीय तथ्य अनुमान से नहीं जोड़े जाते।",
    error: "लक्ष्य लोड या सहेजे नहीं जा सके।",
    saved: "लक्ष्य सहेजा गया।",
    updated: "प्रगति अपडेट हुई।",
    evidence: "स्रोत से सत्यापित आँकड़े उपयोग करें। अधूरी जानकारी को बताया जाएगा, अनुमान नहीं लगाया जाएगा।",
    paceDetail: "सत्यापित आँकड़ों की आवश्यक गति से तुलना करें",
    days: "दिन",
  },
} as const;

const metricLabelsHi: Record<string, string> = {
  monthly_revenue: "मासिक राजस्व",
  profit_margin: "लाभ मार्जिन",
  collections: "वसूली",
  overdue_recovery: "बकाया वसूली",
  leads: "नई लीड",
  quotations: "भेजे गए कोटेशन",
  quotation_conversion: "कोटेशन रूपांतरण",
  new_customers: "नए ग्राहक",
  projects_completed: "पूर्ण परियोजनाएँ",
  delivery_milestones: "डिलीवरी पड़ाव",
  material_cost_control: "सामग्री लागत नियंत्रण",
  inventory_reduction: "इन्वेंटरी में कमी",
  vendor_payments: "विक्रेता भुगतान",
  team_productivity: "टीम उत्पादकता",
  marketing_growth: "विपणन वृद्धि",
  tender_submissions: "निविदा प्रस्तुतियाँ",
  business_expansion: "व्यवसाय विस्तार",
};

const statusLabelsHi: Record<Goal["status"], string> = {
  needs_inputs: "जानकारी आवश्यक",
  on_track: "सही गति पर",
  at_risk: "जोखिम में",
  behind: "पीछे",
  completed: "पूरा हुआ",
};

function metricLabel(metric: string, language: "en" | "hi"): string {
  if (language === "hi") return metricLabelsHi[metric] ?? metric.replaceAll("_", " ");
  return metrics.find(([key]) => key === metric)?.[1] ?? metric.replaceAll("_", " ");
}

function statusLabel(status: Goal["status"], language: "en" | "hi"): string {
  return language === "hi" ? statusLabelsHi[status] : status.replaceAll("_", " ");
}

function unitLabel(unit: string, language: "en" | "hi"): string {
  return language === "hi" && unit === "INR" ? "₹" : unit;
}

function dataMessage(message: string, language: "en" | "hi"): string {
  if (language === "en") return message;
  const knownMessages: Record<string, string> = {
    "At least 7 days between the baseline and current actuals": "आधार और वर्तमान वास्तविक आँकड़ों के बीच कम-से-कम 7 दिन होने चाहिए",
    "Available weekly capacity for this metric": "इस माप के लिए साप्ताहिक उपलब्ध क्षमता",
    "Historical trend is not established from at least seven days of actuals.": "सात दिनों के वास्तविक आँकड़ों से ऐतिहासिक रुझान स्थापित नहीं हुआ है।",
    "Required weekly pace exceeds the capacity entered for this goal.": "आवश्यक साप्ताहिक गति दर्ज की गई क्षमता से अधिक है।",
    "The current historical pace does not project the minimum acceptable target by the deadline.": "वर्तमान ऐतिहासिक गति अंतिम तिथि तक न्यूनतम स्वीकार्य लक्ष्य तक नहीं पहुँचती।",
    "The deadline has passed without reaching the target.": "लक्ष्य प्राप्त किए बिना अंतिम तिथि निकल गई है।",
    "Feasibility remains uncertain until the missing inputs are provided.": "अधूरी जानकारी मिलने तक व्यवहार्यता अनिश्चित रहेगी।",
  };
  return knownMessages[message] ?? message;
}

function todayInIst(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function GoalForm({ onSave, onCancel, busy, language }: {
  onSave: (goal: GoalInput) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
  language: "en" | "hi";
}) {
  const text = translations[language];
  const [values, setValues] = useState({
    title: "",
    metric: "monthly_revenue",
    unit: "INR",
    baseline: "",
    currentValue: "",
    minimumTarget: "",
    target: "",
    stretchTarget: "",
    baselineDate: "",
    currentDate: todayInIst(),
    deadline: "",
    owner: "",
    capacityPerWeek: "",
  });
  const [preview, setPreview] = useState<Goal | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [checking, setChecking] = useState(false);

  const update = (key: keyof typeof values, value: string) => {
    setValues((current) => key === "metric"
      ? { ...current, metric: value, unit: metrics.find(([metric]) => metric === value)?.[2] ?? "count" }
      : { ...current, [key]: value });
    setPreview(null);
  };

  const goalInput = (): GoalInput => ({
    ...values,
    ...(values.capacityPerWeek ? {} : { capacityPerWeek: undefined }),
  });

  const checkFeasibility = async () => {
    setChecking(true);
    setPreviewError("");
    try {
      const result = await apiWrite<Goal>("/goals/feasibility", "POST", goalInput(), makeIdempotencyKey("goal-preview"));
      setPreview(result.data);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : text.error);
    } finally {
      setChecking(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(goalInput());
  };

  return (
    <form className="goal-form section-block" onSubmit={(event) => void submit(event)}>
      <div className="section-head"><div><h2>{text.createTitle}</h2><p>{text.evidence}</p></div><button className="n-button n-button-text" type="button" onClick={onCancel}>{text.cancel}</button></div>
      <div className="goal-fields">
        <label className="goal-field goal-field-wide"><span>{text.goalName}</span><input required minLength={3} maxLength={120} value={values.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label className="goal-field"><span>{text.metric}</span><select value={values.metric} onChange={(event) => update("metric", event.target.value)}>{metrics.map(([key]) => <option key={key} value={key}>{metricLabel(key, language)}</option>)}</select></label>
        <label className="goal-field"><span>{text.owner}</span><input required minLength={2} maxLength={100} value={values.owner} onChange={(event) => update("owner", event.target.value)} /></label>
        <label className="goal-field"><span>{text.baseline}</span><input required inputMode="decimal" pattern="-?(0|[1-9][0-9]*)(\\.[0-9]{1,2})?" value={values.baseline} onChange={(event) => update("baseline", event.target.value)} /></label>
        <label className="goal-field"><span>{text.current}</span><input required inputMode="decimal" pattern="-?(0|[1-9][0-9]*)(\\.[0-9]{1,2})?" value={values.currentValue} onChange={(event) => update("currentValue", event.target.value)} /></label>
        <label className="goal-field"><span>{text.minimum}</span><input required inputMode="decimal" pattern="-?(0|[1-9][0-9]*)(\\.[0-9]{1,2})?" value={values.minimumTarget} onChange={(event) => update("minimumTarget", event.target.value)} /></label>
        <label className="goal-field"><span>{text.target}</span><input required inputMode="decimal" pattern="-?(0|[1-9][0-9]*)(\\.[0-9]{1,2})?" value={values.target} onChange={(event) => update("target", event.target.value)} /></label>
        <label className="goal-field"><span>{text.stretch}</span><input required inputMode="decimal" pattern="-?(0|[1-9][0-9]*)(\\.[0-9]{1,2})?" value={values.stretchTarget} onChange={(event) => update("stretchTarget", event.target.value)} /></label>
        <label className="goal-field"><span>{text.baselineDate}</span><input required type="date" value={values.baselineDate} onChange={(event) => update("baselineDate", event.target.value)} /></label>
        <label className="goal-field"><span>{text.currentDate}</span><input required type="date" value={values.currentDate} onChange={(event) => update("currentDate", event.target.value)} /></label>
        <label className="goal-field"><span>{text.deadline}</span><input required type="date" value={values.deadline} onChange={(event) => update("deadline", event.target.value)} /></label>
        <label className="goal-field"><span>{text.capacity} <small>({values.unit} / week)</small></span><input inputMode="decimal" pattern="(0|[1-9][0-9]*)(\\.[0-9]{1,2})?" value={values.capacityPerWeek} onChange={(event) => update("capacityPerWeek", event.target.value)} /><small>{text.capacityHint}</small></label>
      </div>
      {previewError && <p className="goal-error" role="alert">{previewError}</p>}
      {preview && <GoalForecast goal={preview} text={text} language={language} />}
      <div className="goal-form-actions"><button className="n-button n-button-soft" type="button" disabled={checking || busy} onClick={() => void checkFeasibility()}>{checking ? "…" : text.preview}</button><button className="n-button n-button-primary" type="submit" disabled={busy}>{busy ? "…" : text.save}</button></div>
    </form>
  );
}

function GoalForecast({ goal, text, language }: { goal: Goal; text: GoalText; language: "en" | "hi" }) {
  return (
    <div className="goal-forecast" role="status">
      <div><b>{statusLabel(goal.status, language)}</b><span>{text.forecast}: {goal.projectedAtDeadline} {unitLabel(goal.unit, language)}</span></div>
      {goal.missingInputs.length > 0 && <p>{goal.missingInputs.map((item) => dataMessage(item, language)).join(" · ")}</p>}
      {goal.risks.length > 0 && <ul>{goal.risks.map((risk) => <li key={risk}>{dataMessage(risk, language)}</li>)}</ul>}
      {goal.risks.length === 0 && <p>{text.needed}: {goal.requiredWeeklyPace} {unitLabel(goal.unit, language)} {text.perWeek}</p>}
    </div>
  );
}

export function GoalsExecutionPage({ onToast }: { onToast: (message: string) => void }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actualValues, setActualValues] = useState<Record<string, string>>({});
  const [actualDates, setActualDates] = useState<Record<string, string>>({});
  const text = translations[language];

  const refresh = useCallback(async () => {
    setError("");
    try {
      const result = await apiGet<Goal[]>("/goals");
      setGoals(result.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text.error);
    }
  }, [text.error]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveGoal = async (goal: GoalInput) => {
    setBusy(true);
    setError("");
    try {
      await apiWrite<Goal>("/goals", "POST", goal, makeIdempotencyKey("goal-create"));
      setShowForm(false);
      onToast(text.saved);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  const updateActual = async (goal: Goal) => {
    const value = actualValues[goal.goal_id] ?? "";
    const date = actualDates[goal.goal_id] ?? todayInIst();
    setBusy(true);
    setError("");
    try {
      await apiWrite<Goal>(`/goals/${encodeURIComponent(goal.goal_id)}/progress`, "POST", { value, date }, makeIdempotencyKey("goal-progress"));
      onToast(text.updated);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  const createActionTask = async (goal: Goal) => {
    const action = goal.dailyActions[0];
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      await apiWrite("/tasks", "POST", {
        title: action.title,
        description: `${action.expectedOutcome} ${action.reason}`.trim(),
        owner: action.owner || goal.owner,
        dueDate: todayInIst(),
        sourceType: "goal",
        sourceId: goal.goal_id,
      }, makeIdempotencyKey("goal-action-task"));
      onToast(language === "hi" ? "लक्ष्य की कार्रवाई कार्य सूची में जोड़ी गई।" : "Goal action added to the task queue.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="goals-page">
      <header className="nature-page-heading goals-heading">
        <div><h1>{text.title}</h1><p>{text.description}</p></div>
        <div className="heading-tools">
          <label className="goal-language"><span>{text.language}</span><select value={language} onChange={(event) => setLanguage(event.target.value === "hi" ? "hi" : "en")}><option value="en">English</option><option value="hi">हिन्दी</option></select></label>
          <button className="n-button n-button-primary" onClick={() => setShowForm((shown) => !shown)}>{showForm ? text.cancel : text.newGoal}</button>
        </div>
      </header>
      <p className="goal-source-note">{text.sourceNote}</p>
      {error && <div className="nature-alert" role="alert">{error}<button onClick={() => void refresh()}>Retry</button></div>}
      {showForm && <GoalForm onSave={saveGoal} onCancel={() => setShowForm(false)} busy={busy} language={language} />}
      {goals.length === 0 && !showForm && !error && <div className="empty-connection"><span>◎</span><b>{text.empty}</b><p>{text.emptyDetail}</p><button className="n-button n-button-soft" onClick={() => setShowForm(true)}>{text.newGoal}</button></div>}
      <div className="goal-list">
        {goals.map((goal) => <article className="goal-card section-block" key={goal.goal_id}>
          <div className="goal-card-head">
            <div><span className={`goal-status goal-status-${goal.status}`}>{statusLabel(goal.status, language)}</span><h2>{goal.title}</h2><p>{goal.owner} · {goal.deadline} · {metricLabel(goal.metric, language)}</p></div>
            <div className="goal-progress-value"><b>{goal.progressPercent}%</b><span>{text.progress}</span></div>
          </div>
          <div className="goal-progress-track" role="progressbar" aria-label={`${text.progress}: ${goal.title}`} aria-valuenow={goal.progressPercent} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${goal.progressPercent}%` }} /></div>
          <p className="goal-target-range"><span>{text.baseline}: <b>{goal.baseline} {unitLabel(goal.unit, language)}</b></span><span>{text.minimum}: <b>{goal.minimumTarget} {unitLabel(goal.unit, language)}</b></span><span>{text.target}: <b>{goal.target} {unitLabel(goal.unit, language)}</b></span><span>{text.stretch}: <b>{goal.stretchTarget} {unitLabel(goal.unit, language)}</b></span></p>
          <div className="goal-stat-grid">
            <div><small>{text.needed} · {text.perDay}</small><b>{goal.requiredDailyPace} {unitLabel(goal.unit, language)}</b></div>
            <div><small>{text.needed} · {text.perWeek}</small><b>{goal.requiredWeeklyPace} {unitLabel(goal.unit, language)}</b></div>
            <div><small>{text.forecast}</small><b>{goal.projectedAtDeadline} {unitLabel(goal.unit, language)}</b></div>
            <div><small>{text.deadline}</small><b>{goal.daysRemaining} {text.days}</b></div>
          </div>
          {goal.missingInputs.length > 0 && <div className="goal-needs-input"><b>{text.risks}</b><ul>{goal.missingInputs.map((item) => <li key={item}>{dataMessage(item, language)}</li>)}</ul></div>}
          {goal.risks.length > 0 && <div className="goal-risk-list"><b>{text.risks}</b><ul>{goal.risks.map((risk) => <li key={risk}>{dataMessage(risk, language)}</li>)}</ul></div>}
          {goal.status !== "completed" && <form className="goal-actual-form" onSubmit={(event) => { event.preventDefault(); void updateActual(goal); }}>
            <b>{text.actual}</b>
            <label><span>{text.actualValue}</span><input required inputMode="decimal" value={actualValues[goal.goal_id] ?? ""} onChange={(event) => setActualValues((current) => ({ ...current, [goal.goal_id]: event.target.value }))} /></label>
            <label><span>{text.date}</span><input required type="date" value={actualDates[goal.goal_id] ?? todayInIst()} onChange={(event) => setActualDates((current) => ({ ...current, [goal.goal_id]: event.target.value }))} /></label>
            <button className="n-button n-button-soft" disabled={busy}>{text.saveActual}</button>
          </form>}
          {goal.dailyActions.length > 0 && <div className="goal-action"><b>{text.priorities}</b><p>{language === "hi" ? `इस लक्ष्य की प्रगति दर्ज करें और समीक्षा करें · ${text.paceDetail} (${goal.requiredDailyPace} ${unitLabel(goal.unit, language)} प्रतिदिन)।` : `${goal.dailyActions[0].title} · ${text.paceDetail} (${goal.requiredDailyPace} ${unitLabel(goal.unit, language)} per day).`}</p><button className="n-button n-button-soft" disabled={busy} onClick={() => void createActionTask(goal)}>{language === "hi" ? "कार्य सूची में जोड़ें" : "Add as task"}</button></div>}
          {goal.weeklyMilestones.length > 0 && <div className="goal-milestones"><b>{text.milestones}</b><ol>{goal.weeklyMilestones.slice(0, 4).map((milestone) => <li key={`${milestone.date}-${milestone.targetValue}`}><span>{milestone.date}</span><span>{milestone.targetValue} {unitLabel(goal.unit, language)}</span></li>)}</ol></div>}
          {goal.monthlyOutcomes.length > 0 && <details className="goal-horizon"><summary>{text.monthly} · {goal.monthlyOutcomes.length}</summary><ol>{goal.monthlyOutcomes.map((outcome) => <li key={`${outcome.date}-${outcome.targetValue}`}>{outcome.date} · {outcome.targetValue} {unitLabel(goal.unit, language)}</li>)}</ol></details>}
          {goal.quarterlyObjectives.length > 0 && <details className="goal-horizon"><summary>{text.quarterly} · {goal.quarterlyObjectives.length}</summary><ol>{goal.quarterlyObjectives.map((objective) => <li key={`${objective.date}-${objective.targetValue}`}>{objective.date} · {objective.targetValue} {unitLabel(goal.unit, language)}</li>)}</ol></details>}
          {goal.status === "needs_inputs" && <p className="goal-hint">{text.noForecast}</p>}
        </article>)}
      </div>
    </section>
  );
}
