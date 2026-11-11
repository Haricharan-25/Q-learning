import React from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Layers
} from 'lucide-react';
import { useQLearning } from '../context/QLearningContext';

export const Header = ({ activePage }) => {
  const { 
    summary, 
    simRunning, 
    isTraining, 
    trainAgent, 
    resetAgent, 
    notification 
  } = useQLearning();

  const titles = {
    grid: {
      title: 'Grid Simulator',
      subtitle: 'Environment design, obstacle interactions and step-by-step agent telemetry',
    },
    qtable: {
      title: 'Q-Table Matrix',
      subtitle: 'Action-value state representations and Bellman update calculations',
    },
    analytics: {
      title: 'Learning Analytics',
      subtitle: 'Convergence curves, rewards, success rates, and exploration decay',
    },
  };

  const currentMeta = titles[activePage] || titles.grid;

  return (
    <header className="h-[64px] min-h-[64px] px-6 border-b border-[#282D35] bg-[#14171B] flex items-center justify-between sticky top-0 z-10 select-none">
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-sm font-bold text-[#E6E8EB] tracking-wide uppercase font-mono">
              {currentMeta.title}
            </h1>
            {simRunning && (
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium bg-[#45B880]/10 text-[#45B880] border border-[#45B880]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45B880] animate-pulse"></span>
                <span>SIMULATING</span>
              </span>
            )}
            {isTraining && (
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium bg-[#8A7AFF]/10 text-[#8A7AFF] border border-[#8A7AFF]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8A7AFF] animate-ping"></span>
                <span>TRAINING BATCH</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#9299A5] mt-0.5">{currentMeta.subtitle}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center space-x-3">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-[6px] text-xs font-mono border transition-all ${
              notification.type === 'error'
                ? 'bg-[#181B20] border-[#E15B64]/50 text-[#E15B64]'
                : notification.type === 'warning'
                ? 'bg-[#181B20] border-[#E5A84B]/50 text-[#E5A84B]'
                : notification.type === 'success'
                ? 'bg-[#181B20] border-[#45B880]/50 text-[#45B880]'
                : 'bg-[#181B20] border-[#5B8DEF]/50 text-[#5B8DEF]'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span className="truncate max-w-sm">{notification.msg}</span>
          </div>
        )}

        {/* Train 500 Episodes Button - 40px height */}
        <button
          onClick={() => trainAgent(500)}
          disabled={isTraining || simRunning}
          className="h-[40px] px-3.5 rounded-[6px] text-xs font-semibold font-mono text-[#E6E8EB] bg-[#5B8DEF] hover:bg-[#4a7ad8] disabled:opacity-50 disabled:cursor-not-allowed border border-[#5B8DEF] transition-colors flex items-center space-x-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Train 500 Ep</span>
        </button>

        {/* Reset Agent Button - 40px height */}
        <button
          onClick={resetAgent}
          disabled={isTraining}
          className="h-[40px] px-3.5 rounded-[6px] text-xs font-medium font-mono text-[#9299A5] hover:text-[#E6E8EB] bg-[#181B20] hover:bg-[#21262D] border border-[#282D35] hover:border-[#9299A5]/40 disabled:opacity-50 transition-colors flex items-center space-x-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Agent</span>
        </button>
      </div>
    </header>
  );
};
