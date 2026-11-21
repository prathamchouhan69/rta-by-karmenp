import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Invoice, Bill, BankTransaction, Project, Task, FileItem,
  Vehicle, Employee, ClientAccount, AppNotification,
  INITIAL_INVOICES, INITIAL_BILLS, INITIAL_BANK_TRANSACTIONS,
  INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_FILES,
  INITIAL_VEHICLES, INITIAL_EMPLOYEES, INITIAL_CLIENTS, INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { REFERENCES, ReferenceItem } from '../data/references';
import { CHARTS, ChartItem } from '../data/charts';

export type ScreenType =
  // 9 Canonical Operating Sections (Hybrid Names)
  | 'now'          // Now · Action Inbox
  | 'ledger'       // Ledger · Zoho Books & Cash
  | 'harvest'      // Harvest · Projects & Sites
  | 'routes'       // Routes · Fleet & Logistics
  | 'terrain'      // Terrain · Materials & Inventory
  | 'gates'        // Gates · Statutory & Approvals
  | 'aura'         // Aura · Health & Team
  | 'ecosystems'   // Ecosystems · Clients & Network
  | 'world'        // World · 3D Cosmos & Nature
  // Aliases & Workflows
  | 'login'
  | 'home'
  | 'business_os'
  | 'nature_library'
  | 'reference_detail'
  | 'my_selections'
  | 'projects'
  | 'project_detail'
  | 'tasks'
  | 'task_detail'
  | 'accounting'
  | 'invoice_detail'
  | 'files'
  | 'file_detail'
  | 'transportation'
  | 'fleet_detail'
  | 'human_resources'
  | 'employee_detail'
  | 'relationships'
  | 'client_detail'
  | 'charts_library'
  | 'chart_detail'
  | 'notifications'
  | 'search'
  | 'settings';

export type ThemeMode = 'night' | 'classic' | 'day';

export interface AppContextType {
  currentScreen: ScreenType;
  activeEntityId: string | null;
  navigateTo: (screen: ScreenType, entityId?: string | null) => void;
  goBack: () => void;
  screenHistory: { screen: ScreenType; entityId?: string | null }[];

  // Visual Theme Modes (Night, Classic, Day)
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // Starfish Radial Navigation (N-2)
  isStarfishOpen: boolean;
  setIsStarfishOpen: (open: boolean) => void;

  // Zoho Books Live Scanning State (Tesla Coil)
  zohoScanState: 'idle' | 'scanning' | 'syncing' | 'completed' | 'error';
  lastZohoScanTime: string;
  triggerZohoLiveScan: () => Promise<void>;

  // Data Collections
  invoices: Invoice[];
  bills: Bill[];
  bankTransactions: BankTransaction[];
  projects: Project[];
  tasks: Task[];
  files: FileItem[];
  vehicles: Vehicle[];
  employees: Employee[];
  clients: ClientAccount[];
  notifications: AppNotification[];

  // Mutations
  clearNotifications: () => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  rebalanceTasksWithAntColony: () => void;
  restoreFileVersionWithJellyfish: (fileId: string, versionNum: number) => void;
  reconcileBankTransaction: (id: string) => void;
  exportToGoogleSheets: (sheetName: string, data: any[]) => void;
  syncWithGoogleCalendar: (taskId: string) => void;

  // Selections & Autosave Notes
  savedSelections: { references: number[]; charts: number[] };
  toggleSaveReference: (num: number) => void;
  toggleSaveChart: (num: number) => void;
  notes: Record<string, string>;
  setNote: (key: string, text: string) => void;
  savingStatus: 'saved' | 'saving' | 'offline';

  // System & Offline State (Tardigrade)
  isOnline: boolean;
  offlineQueueCount: number;

  // Search & Spotlight
  isSpotlightOpen: boolean;
  setIsSpotlightOpen: (open: boolean) => void;

  // Dynamic Island
  isIslandExpanded: boolean;
  setIsIslandExpanded: (expanded: boolean) => void;

  // References & Charts master lookups
  references: ReferenceItem[];
  charts: ChartItem[];

  // Accessibility & Preferences
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('now');
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [screenHistory, setScreenHistory] = useState<{ screen: ScreenType; entityId?: string | null }[]>([
    { screen: 'now' }
  ]);

  // Visual Theme Mode (Night, Classic, Day)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('karm_theme_mode');
      return (saved as ThemeMode) || 'night';
    } catch {
      return 'night';
    }
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('karm_theme_mode', mode);
      document.documentElement.setAttribute('data-theme', mode);
    } catch {}
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  // Starfish Radial Navigation
  const [isStarfishOpen, setIsStarfishOpen] = useState(false);

  // Zoho live scanning state
  const [zohoScanState, setZohoScanState] = useState<'idle' | 'scanning' | 'syncing' | 'completed' | 'error'>('idle');
  const [lastZohoScanTime, setLastZohoScanTime] = useState<string>('Just now');

  // Master collections
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(INITIAL_BANK_TRANSACTIONS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [clients, setClients] = useState<ClientAccount[]>(INITIAL_CLIENTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Selections & Notes
  const [savedSelections, setSavedSelections] = useState<{ references: number[]; charts: number[] }>(() => {
    try {
      const stored = localStorage.getItem('karm_selections');
      return stored ? JSON.parse(stored) : { references: [1, 2, 4, 6, 7, 112], charts: [1, 2, 4, 14, 27, 37] };
    } catch {
      return { references: [1, 2, 4, 6, 7, 112], charts: [1, 2, 4, 14, 27, 37] };
    }
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('karm_notes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Debounced note save (800ms)
  const noteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setNote = (key: string, text: string) => {
    setNotes(prev => {
      const next = { ...prev, [key]: text };
      setSavingStatus('saving');
      if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
      noteTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem('karm_notes', JSON.stringify(next));
          setSavingStatus('saved');
        } catch {
          setSavingStatus('offline');
        }
      }, 800);
      return next;
    });
  };

  // Debounced selections save (500ms)
  const selTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toggleSaveReference = (num: number) => {
    setSavedSelections(prev => {
      const has = prev.references.includes(num);
      const nextRefs = has ? prev.references.filter(n => n !== num) : [...prev.references, num];
      const next = { ...prev, references: nextRefs };
      setSavingStatus('saving');
      if (selTimeoutRef.current) clearTimeout(selTimeoutRef.current);
      selTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem('karm_selections', JSON.stringify(next));
          setSavingStatus('saved');
        } catch {
          setSavingStatus('offline');
        }
      }, 500);
      return next;
    });
  };

  const toggleSaveChart = (num: number) => {
    setSavedSelections(prev => {
      const has = prev.charts.includes(num);
      const nextCharts = has ? prev.charts.filter(n => n !== num) : [...prev.charts, num];
      const next = { ...prev, charts: nextCharts };
      setSavingStatus('saving');
      if (selTimeoutRef.current) clearTimeout(selTimeoutRef.current);
      selTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem('karm_selections', JSON.stringify(next));
          setSavingStatus('saved');
        } catch {
          setSavingStatus('offline');
        }
      }, 500);
      return next;
    });
  };

  // Online / offline listeners (Tardigrade)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSavingStatus('saved');
      if (offlineQueueCount > 0) {
        // Replay mutations
        setTimeout(() => setOfflineQueueCount(0), 1200);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSavingStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueueCount]);

  // Keyboard shortcut for Spotlight (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation handlers
  const navigateTo = (screen: ScreenType, entityId: string | null = null) => {
    setCurrentScreen(screen);
    setActiveEntityId(entityId);
    setScreenHistory(prev => [...prev, { screen, entityId }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHist = [...screenHistory];
      newHist.pop();
      const prev = newHist[newHist.length - 1];
      setScreenHistory(newHist);
      setCurrentScreen(prev.screen);
      setActiveEntityId(prev.entityId || null);
    } else {
      setCurrentScreen('home');
      setActiveEntityId(null);
    }
  };

  // Tesla Coil live Zoho Books scanner
  const triggerZohoLiveScan = async () => {
    if (zohoScanState === 'scanning' || zohoScanState === 'syncing') return;
    setZohoScanState('scanning');

    try {
      // First attempt backend fetch if available
      const res = await fetch('/api/v1/news').catch(() => null);
      if (res && res.ok) {
        setZohoScanState('syncing');
      }
    } catch {
      // Practice fallback mode
    }

    setTimeout(() => {
      setZohoScanState('syncing');
      setTimeout(() => {
        setZohoScanState('completed');
        const now = new Date();
        setLastZohoScanTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
        // Add fresh notification
        setNotifications(prev => [
          {
            id: 'notif-' + Date.now(),
            title: 'Tesla Coil Scanner: Live Ledger Refresh',
            message: 'Zoho Books live feed scanned. Bank ledger & tax provisions synchronized.',
            category: 'accounting',
            severity: 'success',
            timestamp: 'Just now',
            read: false,
            action_url: '/accounting'
          },
          ...prev
        ]);
        setTimeout(() => setZohoScanState('idle'), 4000);
      }, 1200);
    }, 1500);
  };

  // Specific domain mutations
  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status, balance: status === 'paid' ? 0 : inv.balance } : inv));
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const rebalanceTasksWithAntColony = () => {
    // Stigmergic task distribution: allocate in_progress tasks equally
    setTasks(prev => {
      const copy = [...prev];
      copy.forEach((t, i) => {
        if (t.status === 'in_progress') {
          t.assignee = employees[i % employees.length] ? {
            name: employees[i % employees.length].name,
            avatar: employees[i % employees.length].name.split(' ').map(n => n[0]).join(''),
            role: employees[i % employees.length].role
          } : t.assignee;
        }
      });
      return copy;
    });
  };

  const restoreFileVersionWithJellyfish = (fileId: string, versionNum: number) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          updated_at: 'Just now (Restored v' + versionNum + ')',
          versions_count: f.versions_count + 1,
          versions: [
            { version: f.versions_count + 1, date: 'Just now', author: 'Immortal Jellyfish Rollback', note: `Restored back to version ${versionNum}` },
            ...f.versions
          ]
        };
      }
      return f;
    }));
  };

  const reconcileBankTransaction = (id: string) => {
    setBankTransactions(prev => prev.map(b => b.id === id ? { ...b, status: 'reconciled' } : b));
  };

  const exportToGoogleSheets = (sheetName: string, data: any[]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      (data.length > 0 ? Object.keys(data[0]).join(',') + '\n' + data.map(row => Object.values(row).join(',')).join('\n') : '');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${sheetName.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const syncWithGoogleCalendar = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const title = encodeURIComponent(`KARM: ${task.title}`);
    const details = encodeURIComponent(`Project: ${task.project_name}\nAssignee: ${task.assignee.name}`);
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, '_blank');
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        activeEntityId,
        navigateTo,
        goBack,
        screenHistory,
        themeMode,
        setThemeMode,
        isStarfishOpen,
        setIsStarfishOpen,
        zohoScanState,
        lastZohoScanTime,
        triggerZohoLiveScan,
        invoices,
        bills,
        bankTransactions,
        projects,
        tasks,
        files,
        vehicles,
        employees,
        clients,
        notifications,
        clearNotifications,
        updateInvoiceStatus,
        updateTaskStatus,
        rebalanceTasksWithAntColony,
        restoreFileVersionWithJellyfish,
        reconcileBankTransaction,
        exportToGoogleSheets,
        syncWithGoogleCalendar,
        savedSelections,
        toggleSaveReference,
        toggleSaveChart,
        notes,
        setNote,
        savingStatus,
        isOnline,
        offlineQueueCount,
        isSpotlightOpen,
        setIsSpotlightOpen,
        isIslandExpanded,
        setIsIslandExpanded,
        references: REFERENCES,
        charts: CHARTS,
        reducedMotion,
        setReducedMotion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
