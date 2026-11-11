import React from 'react';
import { Brain, Terminal, Sparkles, MessageSquareQuote } from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const AgentThinking = () => {
  const { latestStep } = useQLearning();

  const lines = latestStep?.thinking_text || [
    'Agent is idle at starting position.',
    'Awaiting step execution or simulation trigger...',
    'Q-Learning agent will evaluate state Q-values and epsilon threshold at next transition.',
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Agent Thinking</h3>
            <p className="text-[10px] text-slate-400">Algorithmic Decision Reasoning</p>
          </div>
        </div>

        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>RL CoT Stream</span>
        </span>
      </div>

      {/* Reasoning dialogue container */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 font-mono text-xs space-y-2.5 max-h-56 overflow-y-auto">
        {lines.map((line, index) => {
          const isWarning = line.includes('Collision') || line.includes('penalty') || line.includes('OBSTACLE');
          const isGoal = line.includes('GOAL') || line.includes('+100');
          const isQUpdate = line.includes('Q-Update');

          return (
            <div
              key={index}
              className={`flex items-start space-x-2 p-2 rounded-lg transition-all ${
                isWarning
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-900/50'
                  : isGoal
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50'
                  : isQUpdate
                  ? 'bg-purple-950/30 text-purple-300 border border-purple-900/40'
                  : 'bg-slate-950/60 text-slate-300 border border-slate-800/60'
              }`}
            >
              <span className="text-cyan-400 select-none font-bold">›</span>
              <p className="leading-relaxed text-[11px]">{line}</p>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>Model: Tabular Q-Learning Policy</span>
        <span className="text-cyan-400 font-mono">ε-greedy action selection</span>
      </div>
    </div>
  );
};

