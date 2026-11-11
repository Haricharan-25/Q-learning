import React, { useState } from 'react';
import { QLearningProvider } from './context/QLearningContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GridSimulatorPage } from './pages/GridSimulatorPage';
import { QTableExplorerPage } from './pages/QTableExplorerPage';
import { LearningAnalyticsPage } from './pages/LearningAnalyticsPage';
import { SettingsModal } from './components/SettingsModal';

function AppContent() {
  const [activePage, setActivePage] = useState('grid');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0D0F12] text-[#E6E8EB] select-none font-sans">
      {/* Fixed 240px Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Fixed 64px Application Header */}
        <Header activePage={activePage} />
        
        {/* Main Workspace Area with 24px padding */}
        <main className="flex-1 overflow-y-auto p-6 min-w-0 bg-[#0D0F12]">
          {activePage === 'grid' && <GridSimulatorPage />}
          {activePage === 'qtable' && <QTableExplorerPage />}
          {activePage === 'analytics' && <LearningAnalyticsPage />}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default function App() {
  return (
    <QLearningProvider>
      <AppContent />
    </QLearningProvider>
  );
}
