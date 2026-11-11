import React from 'react';
import {
  ShieldAlert,
  MapPin,
  Flag,
  Dices,
  Trash2,
  Brain,
  Play,
  RotateCcw
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const GridConfigPanel = () => {
  const {
    editorMode,
    setEditorMode,
    generateRandomObstacles,
    clearObstacles,
    simRunning,
    isTraining,
    trainAgent,
    summary,
    resetSimulation
  } = useQLearning();

  return (
    <div className="p-4 rounded-[10px] bg-[#181B20] border border-[#282D35] space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#282D35]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#5B8DEF]"></span>
          <h2 className="text-xs font-bold text-[#E6E8EB] uppercase tracking-wider font-mono">
            Grid Configuration
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#666D78]">6×6 Matrix</span>
      </div>

      {/* Mode Selector - 40px buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-[#9299A5] block">Cell Editor Mode</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setEditorMode('obstacle')}
            className={`h-[40px] px-2 rounded-[6px] text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
              editorMode === 'obstacle'
                ? 'bg-[#21262D] text-[#E6E8EB] border-[#5B8DEF]'
                : 'bg-[#14171B] text-[#9299A5] border-[#282D35] hover:text-[#E6E8EB] hover:bg-[#21262D]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#E15B64]" />
            <span>Obstacle</span>
          </button>

          <button
            onClick={() => setEditorMode('start')}
            className={`h-[40px] px-2 rounded-[6px] text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
              editorMode === 'start'
                ? 'bg-[#21262D] text-[#E6E8EB] border-[#45B880]'
                : 'bg-[#14171B] text-[#9299A5] border-[#282D35] hover:text-[#E6E8EB] hover:bg-[#21262D]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#45B880]" />
            <span>Start</span>
          </button>

          <button
            onClick={() => setEditorMode('goal')}
            className={`h-[40px] px-2 rounded-[6px] text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
              editorMode === 'goal'
                ? 'bg-[#21262D] text-[#E6E8EB] border-[#E5A84B]'
                : 'bg-[#14171B] text-[#9299A5] border-[#282D35] hover:text-[#E6E8EB] hover:bg-[#21262D]'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-[#E5A84B]" />
            <span>Goal</span>
          </button>
        </div>
      </div>

      {/* Grid Utility Actions - 40px buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => generateRandomObstacles(0.20)}
          disabled={simRunning || isTraining}
          className="h-[40px] px-3 rounded-[6px] text-xs font-medium text-[#E6E8EB] bg-[#14171B] hover:bg-[#21262D] border border-[#282D35] disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Dices className="w-3.5 h-3.5 text-[#5B8DEF]" />
          <span>Random (20%)</span>
        </button>

        <button
          onClick={clearObstacles}
          disabled={simRunning || isTraining}
          className="h-[40px] px-3 rounded-[6px] text-xs font-medium text-[#E15B64] bg-[#14171B] hover:bg-[#21262D] border border-[#282D35] hover:border-[#E15B64]/40 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Quick Training Batches */}
      <div className="pt-2 border-t border-[#282D35] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#9299A5] flex items-center space-x-1.5">
            <Brain className="w-3.5 h-3.5 text-[#8A7AFF]" />
            <span>Train Policy</span>
          </span>
          <span className="text-[#8A7AFF] font-medium">
            {summary?.training_episodes || 0} episodes
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => trainAgent(100)}
            disabled={isTraining || simRunning}
            className="h-[40px] rounded-[6px] text-xs font-mono font-medium text-[#E6E8EB] bg-[#14171B] hover:bg-[#21262D] border border-[#282D35] disabled:opacity-50 transition-colors"
          >
            +100
          </button>
          <button
            onClick={() => trainAgent(500)}
            disabled={isTraining || simRunning}
            className="h-[40px] rounded-[6px] text-xs font-mono font-medium text-[#5B8DEF] bg-[#14171B] hover:bg-[#21262D] border border-[#282D35] disabled:opacity-50 transition-colors"
          >
            +500
          </button>
          <button
            onClick={() => trainAgent(2000)}
            disabled={isTraining || simRunning}
            className="h-[40px] rounded-[6px] text-xs font-mono font-medium text-[#45B880] bg-[#14171B] hover:bg-[#21262D] border border-[#282D35] disabled:opacity-50 transition-colors"
          >
            +2000
          </button>
        </div>
      </div>
    </div>
  );
};

