import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DEMO_FLUX_GREETING, DEMO_SNAPSHOT } from './demo';
import { REFERENCES } from '../data/references';
import {
  api,
  isSubstantiveInvoice,
  loadLiveWorkspace,
  type LiveWorkspacePayload,
} from './api';
import { useAuth } from './auth';
import { timeStamp } from './format';
import type {
  DocumentRecord,
  FluxMessage,
  GateItem,
  LedgerInvoice,
  SourceMode,
  WorkspaceSnapshot,
} from './types';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'warning' | 'info';
}

interface WorkspaceContextValue {
  snapshot: WorkspaceSnapshot;
  live: LiveWorkspacePayload | null;
  loading: boolean;
  error: string | null;
  ledgerConnected: boolean;
  source: SourceMode;
  refresh: () => Promise<void>;
  markInvoicePaid: (id: string) => void;
  setGateStatus: (id: string, status: GateItem['status']) => void;
  addDocument: (document: DocumentRecord) => void;
  messages: FluxMessage[];
  asking: boolean;
  askFlux: (message: string) => Promise<void>;
  clearConversation: () => void;
  toast: Toast | null;
  notify: (message: string, tone?: Toast['tone']) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function cloneDemo(): WorkspaceSnapshot {
  return structuredClone(DEMO_SNAPSHOT);
}

function nowLabel(): string {
  return `${timeStamp()} IST`;
}

function makeAssistantMessage(
  content: string,
  confidence: FluxMessage['confidence'] = 'medium',
  evidence: string[] = [],
): FluxMessage {
  return {
    id: `flux-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    content,
    time: timeStamp(),
    confidence,
    evidence,
  };
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, mode } = useAuth();
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(cloneDemo);
  const [live, setLive] = useState<LiveWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ledgerConnected, setLedgerConnected] = useState(false);
  const [messages, setMessages] = useState<FluxMessage[]>([
    makeAssistantMessage(DEMO_FLUX_GREETING, 'high', [
      'Demo workspace',
      'Zoho Books practice adapter',
      'Reference video guides',
    ]),
  ]);
  const [asking, setAsking] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    setToast({ id: Date.now(), message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') return;
    if (mode === 'demo') {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 520));
      setSnapshot((previous) => ({
        ...previous,
        source: 'demo',
        organization: 'Karm Enterprises',
        operator: 'Karmen',
        syncedAt: nowLabel(),
        references: REFERENCES,
      }));
      setLedgerConnected(false);
      setLive(null);
      setLoading(false);
      setError(null);
      notify('Demo workspace refreshed — every record is sample data.', 'info');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await loadLiveWorkspace();
      setLive(payload);
      const usableInvoices = payload.invoices.filter(isSubstantiveInvoice);
      const connected = usableInvoices.length > 0;
      setLedgerConnected(connected);
      setSnapshot((previous) => {
        const next: WorkspaceSnapshot = {
          ...previous,
          source: mode,
          organization: payload.organization.name || previous.organization,
          syncedAt: nowLabel(),
          references: REFERENCES,
        };
        if (connected) {
          next.invoices = usableInvoices;
          next.kpis = previous.kpis.map((kpi) => {
            if (kpi.id !== 'receivables') return kpi;
            const overdue = usableInvoices
              .filter((invoice) => invoice.status === 'overdue')
              .reduce((sum, invoice) => sum + Number.parseFloat(invoice.balance || '0'), 0);
            return {
              ...kpi,
              caption: `${usableInvoices.length} invoices from Zoho Books`,
              delta: overdue > 0 ? `₹${(overdue / 100000).toFixed(1)} L overdue` : 'No overdue balance',
            };
          });
        }
        if (payload.bills.length > 0) next.bills = payload.bills;
        return next;
      });
      notify(
        connected
          ? `Zoho Books sync complete · ${usableInvoices.length} invoices loaded.`
          : 'Workspace connected. Operational sample data remains visible while Zoho has no records.',
        connected ? 'success' : 'info',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh the workspace.');
      notify('Sync failed. Showing the last known workspace.', 'warning');
    } finally {
      setLoading(false);
    }
  }, [mode, notify, status]);

  useEffect(() => {
    if (status === 'authenticated') void refresh();
    // refresh is intentionally triggered only when the workspace mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, mode]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const markInvoicePaid = useCallback(
    (id: string) => {
      const invoice = snapshot.invoices.find((item) => item.id === id);
      setSnapshot((previous) => ({
        ...previous,
        invoices: previous.invoices.map((item) =>
          item.id === id ? { ...item, status: 'paid', balance: '0.00' } : item,
        ),
      }));
      notify(
        invoice
          ? `${invoice.number} marked paid in this workspace. Zoho remains the source of truth.`
          : 'Invoice updated.',
        'success',
      );
    },
    [notify, snapshot.invoices],
  );

  const setGateStatus = useCallback(
    (id: string, status: GateItem['status']) => {
      setSnapshot((previous) => ({
        ...previous,
        gates: previous.gates.map((gate) => (gate.id === id ? { ...gate, status } : gate)),
      }));
      notify('Compliance gate updated in the local workspace.', 'success');
    },
    [notify],
  );

  const addDocument = useCallback(
    (document: DocumentRecord) => {
      setSnapshot((previous) => ({
        ...previous,
        documents: [document, ...previous.documents],
      }));
      notify(`${document.kind} added to Documents.`, 'success');
    },
    [notify],
  );

  const askFlux = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || asking) return;

      const userMessage: FluxMessage = {
        id: `you-${Date.now()}`,
        role: 'user',
        content: trimmed,
        time: timeStamp(),
      };
      const pending = makeAssistantMessage('Reading the live record set…', undefined, []);
      pending.pending = true;
      setMessages((previous) => [...previous, userMessage, pending]);
      setAsking(true);

      const finish = (answer: FluxMessage) => {
        setMessages((previous) => previous.map((item) => (item.id === pending.id ? answer : item)));
        setAsking(false);
      };

      if (mode === 'demo') {
        await new Promise((resolve) => setTimeout(resolve, 900));
        const lower = trimmed.toLowerCase();
        const insight =
          snapshot.insights.find((item) => {
            const haystack = `${item.question} ${item.answer}`.toLowerCase();
            return lower
              .split(/\s+/)
              .filter((word) => word.length > 4)
              .some((word) => haystack.includes(word));
          }) ?? snapshot.insights[0];
        finish(
          makeAssistantMessage(
            insight?.answer ??
              'I can only answer from the records currently loaded in this demo workspace. Try asking about cash, overdue invoices, dispatch, compliance gates, fleet, or a project.',
            insight?.confidence ?? 'medium',
            insight?.evidence ?? ['Demo workspace'],
          ),
        );
        return;
      }

      try {
        const history = messages
          .filter((item) => !item.pending)
          .slice(-8)
          .map((item) => ({ role: item.role, content: item.content }) as const);
        const answer = await api.ask(trimmed, [...history]);
        const evidence = (answer.evidence ?? [])
          .map((item) => item.label || item.detail || item.source || '')
          .filter(Boolean);
        finish(
          makeAssistantMessage(
            answer.answer,
            answer.confidence ?? 'low',
            evidence.length ? evidence : ['KARM workspace records'],
          ),
        );
      } catch (err) {
        finish(
          makeAssistantMessage(
            `I could not reach the Flux workspace just now: ${
              err instanceof Error ? err.message : 'unknown error'
            }. The local operating deck is still available.`,
            'low',
            ['Connection fallback'],
          ),
        );
      }
    },
    [asking, messages, mode],
  );

  const clearConversation = useCallback(() => {
    setMessages([
      makeAssistantMessage(DEMO_FLUX_GREETING, 'high', [
        mode === 'demo' ? 'Demo workspace' : 'Connected workspace',
      ]),
    ]);
  }, [mode]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      snapshot,
      live,
      loading,
      error,
      ledgerConnected,
      source: snapshot.source,
      refresh,
      markInvoicePaid,
      setGateStatus,
      addDocument,
      messages,
      asking,
      askFlux,
      clearConversation,
      toast,
      notify,
    }),
    [
      snapshot,
      live,
      loading,
      error,
      ledgerConnected,
      refresh,
      markInvoicePaid,
      setGateStatus,
      addDocument,
      messages,
      asking,
      askFlux,
      clearConversation,
      toast,
      notify,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}
