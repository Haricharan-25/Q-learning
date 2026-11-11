import React from 'react';
import { 
  Grid3X3, 
  Table2, 
  LineChart, 
  Settings, 
  Terminal,
  Activity,
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useQLearning } from '../context/QLearningContext';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { 
    summary, 
    simRunning, 
    isTraining, 
    setIsSettingsOpen, 
    hyperparams 
  } = useQLearning();

  const navItems = [
    {
      id: 'grid',
      label: 'Simulator',
      icon: Grid3X3,
      badge: simRunning ? 'RUNNING' : null,
      badgeColor: 'text-[#45B880] border-[#45B880]/40 bg-[#45B880]/10',
    },
    {
      id: 'qtable',
      label: 'Q-Table',
      icon: Table2,
      badge: summary?.q_states_count ? `${summary.q_states_count}` : null,
      badgeColor: 'text-[#5B8DEF] border-[#5B8DEF]/40 bg-[#5B8DEF]/10',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: LineChart,
      badge: summary?.training_episodes ? `${summary.training_episodes} ep` : null,
      badgeColor: 'text-[#8A7AFF] border-[#8A7AFF]/40 bg-[#8A7AFF]/10',
    },
  ];

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col justify-between h-screen border-r border-[#282D35] bg-[#14171B] select-none z-20">
      <div>
        {/* Brand Header - exactly 64px tall to align with top header */}
        <div className="h-[64px] px-4 flex items-center justify-between border-b border-[#282D35]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#181B20] border border-[#282D35] flex items-center justify-center">
              <Terminal className="w-4 h-4 text-[#5B8DEF]" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider text-[#E6E8EB] uppercase font-mono">
                Q-Learning Lab
              </div>
              <div className="text-[11px] text-[#666D78]">Grid Navigation</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#181B20] text-[#9299A5] border border-[#282D35]">
            v2.1
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-[#666D78] uppercase font-mono">
            Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full h-[40px] px-3 rounded-[6px] flex items-center justify-between text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#181B20] text-[#E6E8EB] border border-[#5B8DEF]/50 font-semibold shadow-sm'
                    : 'text-[#9299A5] hover:text-[#E6E8EB] hover:bg-[#21262D] border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#5B8DEF]' : 'text-[#666D78]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Telemetry & Settings Panel */}
      <div className="p-3 border-t border-[#282D35] space-y-3 bg-[#14171B]">
        {/* Environment Status */}
        <div className="p-3 rounded-[6px] bg-[#181B20] border border-[#282D35] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9299A5]">Path Validity</span>
            {summary?.path_reachable ? (
              <span className="flex items-center text-[#45B880] font-medium font-mono text-[10px] space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Reachable</span>
              </span>
            ) : (
              <span className="flex items-center text-[#E5A84B] font-medium font-mono text-[10px] space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Blocked</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9299A5]">Exploration (ε)</span>
            <span className="text-[#8A7AFF] font-mono font-medium text-[11px]">
              {(summary?.epsilon ?? hyperparams.epsilon).toFixed(4)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9299A5]">State Mode</span>
            <span className="text-[#E6E8EB] font-mono text-[10px] uppercase">
              {hyperparams.state_mode === 'coordinate' ? '6×6 Coord' : '3×3 Obs'}
            </span>
          </div>
        </div>

        {/* Settings Button - 40px height */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full h-[40px] px-3 rounded-[6px] flex items-center justify-center space-x-2 text-xs font-medium text-[#E6E8EB] bg-[#181B20] hover:bg-[#21262D] border border-[#282D35] transition-colors"
        >
          <Settings className="w-4 h-4 text-[#9299A5]" />
          <span>Algorithm Settings</span>
        </button>

        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[#666D78]">
          <span>Engine Status</span>
          <span className="text-[#45B880] flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#45B880]"></span>
            <span>Online</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
