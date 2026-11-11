import React from 'react';
import { 
  RotateCw, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const LoopAlert = () => {
  const { 
    activeLoopInfo, 
    latestStep, 
    hyperparams, 
    toggleRecovery, 
    setSelectedStateKey 
  } = useQLearning();

  if (!activeLoopInfo && (!latestStep || !latestStep.loop_detected)) {
    return null;
  }

  const loop = activeLoopInfo || latestStep?.loop_info;
  if (!loop) return null;

  const {
    title,
    loop_type,
    loop_cells,
    loop_actions,
    action_responsible_name,
    cycle_length,
    description,
    explanation,
  } = loop;

  const isRecovery = latestStep?.is_recovery;
  const recoveryAction = latestStep?.recovery_action;
  const recoveryReason = latestStep?.recovery_reason;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-orange-950/80 border-2 border-amber-500/70 shadow-xl shadow-amber-950/40 backdrop-blur-xl space-y-3">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-spin-slow">
            <RotateCw className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-amber-300 tracking-wide">
                LOOP DETECTED: {title}
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-900/60 text-amber-200 border border-amber-600/50">
                Period {cycle_length}
              </span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Recovery Mode Badge */}
        <div className="flex items-center space-x-2">
          {hyperparams.recovery_enabled ? (
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recovery Active</span>
            </span>
          ) : (
            <button
              onClick={toggleRecovery}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Enable Recovery</span>
            </button>
          )}
        </div>
      </div>

      {/* Repeated Loop Cells and Actions Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        {/* Cells involved */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-900/50 flex items-center justify-between">
          <span className="text-slate-400 font-sans">Looping Cells:</span>
          <div className="flex items-center space-x-1.5">
            {loop_cells?.map((c, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 font-bold"
              >
                ({c[0]},{c[1]})
              </span>
            ))}
          </div>
        </div>

        {/* Repeated Actions Sequence */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-900/50 flex items-center justify-between">
          <span className="text-slate-400 font-sans">Action Sequence:</span>
          <div className="flex items-center space-x-1 text-slate-300">
            {loop_actions?.slice(-4).map((act, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  act === action_responsible_name
                    ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                    : 'bg-slate-900 text-slate-300 border border-slate-700'
                }`}
              >
                {act}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Algorithmic Reason Explanation */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1.5">
        <div className="flex items-center space-x-1.5 text-amber-300 font-semibold font-sans">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Why is the agent looping?</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-[11px]">{explanation}</p>
      </div>

      {/* Intelligent Recovery Output (when recovery step was taken) */}
      {isRecovery && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold font-sans flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Controlled Recovery Strategy Applied</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-500/50 font-bold text-[11px]">
              Alternative Action: {recoveryAction}
            </span>
          </div>
          <p className="text-slate-300 text-[11px] font-sans leading-relaxed">{recoveryReason}</p>
        </div>
      )}
    </div>
  );
};
