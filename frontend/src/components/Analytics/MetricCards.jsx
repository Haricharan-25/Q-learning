import React from 'react';
import { 
  Trophy, 
  Flame, 
  Footprints, 
  ShieldAlert, 
  Compass, 
  Layers 
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const MetricCards = () => {
  const { summary, analytics, hyperparams } = useQLearning();

  const totalEp = summary?.training_episodes ?? analytics.total_episodes ?? 0;
  const history = analytics.episodes_history || [];

  // Compute metrics from history
  const recentHist = history.slice(-50);
  const recentSuccesses = recentHist.filter((h) => h.success).length;
  const successRate = recentHist.length > 0 ? ((recentSuccesses / recentHist.length) * 100).toFixed(1) : 0;
  
  const avgSteps = recentHist.length > 0 
    ? (recentHist.reduce((acc, h) => acc + h.steps, 0) / recentHist.length).toFixed(1)
    : 0;

  const totalCollisions = history.reduce((acc, h) => acc + (h.collisions || 0), 0);
  const currentEps = (summary?.epsilon ?? analytics.epsilon ?? 1.0).toFixed(4);
  const stateCount = summary?.q_states_count ?? analytics.q_states_count ?? 0;

  const cards = [
    {
      label: 'Training Episodes',
      value: totalEp,
      unit: 'episodes',
      icon: Flame,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-cyan-300',
    },
    {
      label: 'Goal Success Rate',
      value: `${successRate}%`,
      unit: 'recent 50 ep',
      icon: Trophy,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-300',
    },
    {
      label: 'Avg Steps to Goal',
      value: avgSteps,
      unit: 'steps / episode',
      icon: Footprints,
      color: 'from-purple-500 to-indigo-500',
      textColor: 'text-purple-300',
    },
    {
      label: 'Total Collisions',
      value: totalCollisions,
      unit: 'obstacle bumps',
      icon: ShieldAlert,
      color: 'from-rose-500 to-amber-500',
      textColor: 'text-rose-300',
    },
    {
      label: 'Exploration Rate (ε)',
      value: currentEps,
      unit: 'decaying toward min',
      icon: Compass,
      color: 'from-amber-500 to-yellow-500',
      textColor: 'text-amber-300',
    },
    {
      label: 'Distinct Q-States',
      value: stateCount,
      unit: 'tabular keys',
      icon: Layers,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-blue-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-medium leading-tight">{card.label}</span>
              <div className={`p-1.5 rounded-lg bg-gradient-to-tr ${card.color} text-slate-950 shadow-sm`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className={`text-xl font-bold font-mono ${card.textColor}`}>{card.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{card.unit}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

