import React, { useEffect } from 'react';
import { AppProvider, useApp, ScreenType } from './context/AppContext';
import { AppHeader, AppNavigation } from './components/layout/AppHeader';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { FluxLoadingParticle } from './components/common/FluxLoadingParticle';
import { LockScreen } from './components/screens/LockScreen';

// Screens
import { LoginScreen } from './components/screens/LoginScreen';
import { HomeCommandCenter } from './components/screens/HomeCommandCenter';
import { NowScreen } from './components/screens/NowScreen';
import { AccountingScreen } from './components/screens/AccountingScreen';
import { InvoiceDetail } from './components/screens/InvoiceDetail';
import { ProjectsScreen } from './components/screens/ProjectsScreen';
import { ProjectDetail } from './components/screens/ProjectDetail';
import { TasksScreen } from './components/screens/TasksScreen';
import { TaskDetail } from './components/screens/TaskDetail';
import { FilesScreen } from './components/screens/FilesScreen';
import { FileDetail } from './components/screens/FileDetail';
import { TransportationScreen } from './components/screens/TransportationScreen';
import { FleetDetail } from './components/screens/FleetDetail';
import { HRScreen } from './components/screens/HRScreen';
import { EmployeeDetail } from './components/screens/EmployeeDetail';
import { RelationshipsScreen } from './components/screens/RelationshipsScreen';
import { ClientDetail } from './components/screens/ClientDetail';
import { NatureLibraryScreen } from './components/screens/NatureLibraryScreen';
import { ReferenceDetail } from './components/screens/ReferenceDetail';
import { ChartsLibraryScreen } from './components/screens/ChartsLibraryScreen';
import { ChartDetail } from './components/screens/ChartDetail';
import { MySelectionsScreen } from './components/screens/MySelectionsScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { SearchScreen } from './components/screens/SearchScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { BusinessOSScreen } from './components/screens/BusinessOSScreen';
import { TerrainScreen } from './components/screens/TerrainScreen';
import { GatesScreen } from './components/screens/GatesScreen';
import { AuraScreen } from './components/screens/AuraScreen';
import { WorldScreen } from './components/screens/WorldScreen';

// Navigation
import { StarfishRadialFan } from './components/navigation/StarfishRadialFan';
import { TardigradeOfflineBanner } from './components/common/TardigradeOfflineBanner';
import { MobileBottomBar } from './components/layout/MobileBottomBar';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const ScreenRouter: React.FC = () => {
  const { 
    currentScreen, 
    isSpotlightOpen, 
    setIsSpotlightOpen, 
    reducedMotion, 
    themeMode,
    zohoScanState,
    savingStatus
  } = useApp();

  // Handle Cmd+K global spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(!isSpotlightOpen);
      }
      if (e.key === 'Escape' && isSpotlightOpen) {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpotlightOpen, setIsSpotlightOpen]);

  // If on login screen, render it full view
  if (currentScreen === 'login') {
    return <LoginScreen />;
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      // 9 Canonical Sections (Hybrid Names)
      case 'now':
        return <NowScreen />;
      case 'ledger':
        return <AccountingScreen />;
      case 'harvest':
        return <ProjectsScreen />;
      case 'routes':
        return <TransportationScreen />;
      case 'terrain':
        return <TerrainScreen />;
      case 'gates':
        return <GatesScreen />;
      case 'aura':
        return <AuraScreen />;
      case 'ecosystems':
        return <RelationshipsScreen />;
      case 'world':
        // Embedded into Now and real operating screens
        return <NowScreen />;

      // Additional Modules & Workflows
      case 'home':
        return <HomeCommandCenter />;
      case 'accounting':
        return <AccountingScreen />;
      case 'invoice_detail':
        return <InvoiceDetail />;
      case 'projects':
        return <ProjectsScreen />;
      case 'project_detail':
        return <ProjectDetail />;
      case 'tasks':
        return <TasksScreen />;
      case 'task_detail':
        return <TaskDetail />;
      case 'files':
        return <FilesScreen />;
      case 'file_detail':
        return <FileDetail />;
      case 'transportation':
        return <TransportationScreen />;
      case 'fleet_detail':
        return <FleetDetail />;
      case 'human_resources':
        return <HRScreen />;
      case 'employee_detail':
        return <EmployeeDetail />;
      case 'relationships':
        return <RelationshipsScreen />;
      case 'client_detail':
        return <ClientDetail />;
      case 'nature_library':
        return <TerrainScreen />;
      case 'reference_detail':
        return <NowScreen />;
      case 'charts_library':
        return <AccountingScreen />;
      case 'chart_detail':
        return <AccountingScreen />;
      case 'my_selections':
        return <MySelectionsScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'search':
        return <SearchScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'business_os':
        return <BusinessOSScreen />;
      default:
        return <NowScreen />;
    }
  };

const isFluxActive = zohoScanState === 'scanning' || zohoScanState === 'syncing';
  const isSaving = savingStatus === 'saving';
  const { isLocked } = useApp();

  return (
    <div 
      data-theme={themeMode}
      className={`min-h-screen bg-[#05070a] text-slate-100 flex flex-col relative selection:bg-cyan-500 selection:text-black ${reducedMotion ? 'reduce-motion' : ''}`}
    >
      {/* Official KARM Nautilus Logo Watermark at exactly 6.5% Opacity */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden" 
        aria-hidden="true"
      >
        <img 
          src="/karm-logo-original.png" 
          alt="" 
          className="w-[500px] md:w-[700px] lg:w-[900px] max-w-none select-none opacity-[0.065] filter contrast-125" 
        />
      </div>

      {/* Lock Screen Overlay */}
      {isLocked && <LockScreen />}

      {/* Main Interactive Cockpit Stack */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {/* iPhone Dynamic Island at top center */}
        <DynamicIsland />

        {/* Flux Loading Particle (Video 13) - Shows during active Flux states */}
        {(isFluxActive || isSaving) && (
          <div className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none" aria-hidden="true">
            <FluxLoadingParticle 
              size={48} 
              particleCount={12} 
              isActive={isFluxActive || isSaving}
              className="mx-auto"
            />
            <p className="text-center text-[10px] font-mono text-cyan-400 mt-1">
              {isFluxActive ? 'Flux neural core active' : 'Saving...'}
            </p>
          </div>
        )}

        {/* Main Sticky Header */}
        <AppHeader />

        {/* Main Layout Body: Left Sidebar + Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1700px] mx-auto">
          <AppNavigation />

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {renderActiveScreen()}
          </main>
        </div>

        {/* Starfish Radial Fan Floating Controller (Bottom-Right) */}
        <StarfishRadialFan />

        {/* Mobile Thumb Navigation Dock */}
        <MobileBottomBar />

        {/* Tardigrade Cryptobiosis Sentinel & Offline Simulation */}
        <TardigradeOfflineBanner />

        {/* Cmd+K Spotlight Modal */}
        {isSpotlightOpen && <SearchScreen />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ScreenRouter />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;