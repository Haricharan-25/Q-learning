import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowRight, Sparkles, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const BellmanCalculator = () => {
  const { latestStep } = useQLearning();

  if (!latestStep) {
    return (
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center text-center">
        <Calculator className="w-7 h-7 text-slate-600 mb-2 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-300">Live Bellman Equation Updates</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          As the agent interacts with the environment, each term in the Bellman optimality update will appear here with dynamic calculations.
        </p>
      </div>
    );
  }

  const {
    current_position,
    action_name,
    action_arrow,
    old_q,
    new_q,
    reward,
    next_max_q,
    alpha,
    gamma,
    state_name,
    next_state_name,
    is_collision,
  } = latestStep;

  const tdTarget = reward + gamma * next_max_q;
  const tdError = tdTarget - old_q;
  const deltaQ = alpha * tdError;

  return (
    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <Calculator className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Dynamic Bellman Equation Inspector
            </h3>
            <p className="text-[10px] text-slate-400">Step-by-step Q-value derivation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-mono">Selected Action:</span>
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            {action_arrow} {action_name}
          </span>
        </div>
      </div>

      {/* Interactive Math Pipeline */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono items-center">
        {/* Term 1: Old Q */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-sans block mb-1">Old Q(s, a)</span>
          <span className="text-sm font-bold text-slate-300">{old_q.toFixed(3)}</span>
        </div>

        <div className="text-cyan-400 font-bold text-base">+</div>

        {/* Term 2: Alpha * TD Error */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-sans block mb-1">α × [TD Target - Old]</span>
          <span className="text-xs text-slate-300">
            {alpha} × [{tdTarget.toFixed(2)} - {old_q.toFixed(2)}]
          </span>
        </div>

        <div className="text-cyan-400 font-bold text-base">=</div>

        {/* Term 3: New Q (Animated!) */}
        <motion.div
          key={new_q}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`p-3 rounded-xl border-2 shadow-lg ${
            new_q > old_q
              ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-emerald-950/50'
              : new_q < old_q
              ? 'bg-rose-950/60 border-rose-400 text-rose-300 shadow-rose-950/50'
              : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}
        >
          <span className="text-[10px] font-sans font-bold block mb-1">New Q(s, a)</span>
          <span className="text-base font-extrabold">{new_q.toFixed(4)}</span>
        </motion.div>
      </div>

      {/* Breakdown Details Pill */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono space-y-1 text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Reward received (r):</span>
          <span className={`font-bold ${reward < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {reward > 0 ? `+${reward}` : reward}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Discounted next max Q (γ × max Q(s')):</span>
          <span className="text-purple-300">
            {gamma} × {next_max_q.toFixed(3)} = {(gamma * next_max_q).toFixed(3)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Temporal Difference Target (r + γ max Q'):</span>
          <span className="text-cyan-300 font-bold">{tdTarget.toFixed(3)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">TD Error (Target - Current):</span>
          <span className={tdError < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {tdError.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};

