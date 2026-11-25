import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './app/auth';
import { RouterProvider, useRouter } from './app/router';
import { WorkspaceProvider } from './app/workspace';
import { Shell } from './app/Shell';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LoginScreen } from './app/screens/Login';
import { CommandDeckScreen } from './app/screens/CommandDeck';
import { DashboardScreen } from './app/screens/Dashboard';
import { MoneyScreen } from './app/screens/Money';
import { ProjectsScreen } from './app/screens/Projects';
import { FleetScreen } from './app/screens/Fleet';
import { MaterialsScreen } from './app/screens/Materials';
import { GatesScreen } from './app/screens/Gates';
import { PeopleScreen } from './app/screens/People';
import { ClientsScreen } from './app/screens/Clients';
import { DocumentsScreen } from './app/screens/Documents';
import { FluxScreen } from './app/screens/Flux';
import { SettingsScreen } from './app/screens/Settings';

const BootSplash: React.FC = () => {
  const { themeMode } = useApp();
  const studio = themeMode === 'studio' || themeMode === 'day';
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
      style={{ background: studio ? '#eee8f5' : '#07070b', color: studio ? '#221a2e' : '#f6f3ec' }}
      role="status"
      aria-live="polite"
      aria-label="Opening the RTA by KARM workspace"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: studio
            ? 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(109,74,255,0.18), transparent 62%)'
            : 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,211,238,0.14), transparent 62%)',
        }}
      />
      <div className="relative flex flex-col items-center text-center">
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border"
          style={{
            borderColor: studio ? 'rgba(51,30,82,0.14)' : 'rgba(255,255,255,0.1)',
            background: studio ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.04)',
          }}
        >
          <img src="/karm-symbol-white.png" alt="" className="h-12 w-12 object-contain" />
          <span
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full"
            style={{ background: studio ? '#6d4aff' : '#22d3ee', boxShadow: '0 0 12px rgba(34,211,238,0.5)' }}
          />
        </div>
        <div className="mt-6 text-[19px] font-extrabold tracking-[-0.05em]">
          RTA <span className="font-medium opacity-60">by</span> KARM
        </div>
        <div
          className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.24em]"
          style={{ color: studio ? '#6d4aff' : '#22d3ee' }}
        >
          living business operating system
        </div>
        <div className="mt-8 h-[2px] w-40 overflow-hidden rounded-full" style={{ background: studio ? 'rgba(51,30,82,0.1)' : 'rgba(255,255,255,0.08)' }}>
          <span
            className="block h-full w-1/3 rounded-full"
            style={{
              background: studio ? '#6d4aff' : '#22d3ee',
              animation: 'k-loading 1.4s ease-in-out infinite',
            }}
          />
        </div>
        <p className="mt-4 text-[10px] opacity-50">Opening the operating deck…</p>
      </div>
    </div>
  );
};

const ScreenSwitch: React.FC = () => {
  const { route } = useRouter();

  switch (route.key) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'money':
      return <MoneyScreen />;
    case 'projects':
      return <ProjectsScreen />;
    case 'fleet':
      return <FleetScreen />;
    case 'materials':
      return <MaterialsScreen />;
    case 'gates':
      return <GatesScreen />;
    case 'people':
      return <PeopleScreen />;
    case 'clients':
      return <ClientsScreen />;
    case 'documents':
      return <DocumentsScreen />;
    case 'flux':
      return <FluxScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'today':
    case 'login':
    default:
      return <CommandDeckScreen />;
  }
};

const AuthenticatedWorkspace: React.FC = () => {
  const { reducedMotion } = useApp();
  return (
    <WorkspaceProvider>
      <Shell>
        <div key="workspace" className={reducedMotion ? 'reduce-motion' : ''}>
          <ScreenSwitch />
        </div>
      </Shell>
    </WorkspaceProvider>
  );
};

const Gate: React.FC = () => {
  const { status } = useAuth();
  if (status === 'booting') return <BootSplash />;
  if (status !== 'authenticated') return <LoginScreen />;
  return <AuthenticatedWorkspace />;
};

export const App: React.FC = () => (
  <ErrorBoundary>
    <AppProvider>
      <AuthProvider>
        <RouterProvider>
          <Gate />
        </RouterProvider>
      </AuthProvider>
    </AppProvider>
  </ErrorBoundary>
);

export default App;
