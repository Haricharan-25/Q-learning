import React from 'react';
import { AlertOctagon, ArrowRight, ShieldAlert, Sparkles, TrendingDown } from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const CollisionAlert = () => {
  const { latestStep } = useQLearning();

  if (!latestStep || !latestStep.is_collision) {
    return null;
  }

  const {
    current_position,
    target_position,
    action_name,
    action_arrow,
    reward,
    old_q,
    new_q,
    collision_type,
    collision_explanation,
  } = latestStep;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-amber-950/80 border-2 border-rose-500/60 shadow-xl shadow-rose-950/40 backdrop-blur-xl animate-collision-shake">
      <div className="flex items-start space-x-3">
        <div className="p-2.5 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 flex-shrink-0 animate-pulse">
          <AlertOctagon className="w-5 h-5 text-rose-400" />
        </div>

        <div className="flex-1 space-y-2">
          {/* Headline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-rose-300 tracking-wide">
                Obstacle Collision Detected!
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/60 text-rose-200 border border-rose-700/60">
                Reward {reward}
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
              Agent Kept at ({current_position[0]}, {current_position[1]})
            </span>
          </div>

          {/* Details sentence */}
          <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
            {collision_explanation}
          </p>

          {/* Mathematical Q-Value Drop Pill */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-rose-900/60 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span className="text-slate-300">
                Q(({current_position[0]},{current_position[1]}), {action_name}):
              </span>
              <span className="text-slate-400 line-through">{old_q.toFixed(3)}</span>
              <span className="text-rose-400 font-bold">→ {new_q.toFixed(3)}</span>
            </div>

            <span className="text-[10px] text-slate-400 font-sans">
              Bellman Penalty Applied
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

