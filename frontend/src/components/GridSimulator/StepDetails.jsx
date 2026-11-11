import React from 'react';
import { 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  Activity, 
  Sparkles, 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const StepDetails = () => {
  const { latestStep, historyIndex, history } = useQLearning();

  if (!latestStep) {
    return (
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center text-center min-h-[220px]">
        <Activity className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-300">No Step Executed Yet</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Click <span className="text-cyan-400 font-medium">"Step Next"</span> or <span className="text-emerald-400 font-medium">"Start Sim"</span> to watch the agent make decisions and observe Q-value changes.
        </p>
      </div>
    );
  }

  const {
    current_position,
    next_position,
    action_name,
    action_arrow,
    reward,
    is_collision,
    collision_type,
    old_q,
    new_q,
    q_values_before,
    q_values_after,
    state_name,
    next_state_name,
    decision_reason,
    td_error,
    next_max_q,
    alpha,
    gamma,
  } = latestStep;

  const actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const deltaQ = new_q - old_q;

  return (
    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
      {/* Step Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Step Telemetry #{historyIndex >= 0 ? historyIndex + 1 : 1}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Reward:</span>
          <span
            className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full border ${
              reward > 0
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : reward < -1
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {reward > 0 ? `+${reward}` : reward}
          </span>
        </div>
      </div>

      {/* Movement Transition Banner */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 items-center text-center">
        {/* Current Position */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-slate-400 font-medium">Current Position</span>
          <span className="text-base font-bold font-mono text-cyan-300 mt-0.5">
            ({current_position[0]}, {current_position[1]})
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[110px]" title={state_name}>
            {state_name}
          </span>
        </div>

        {/* Action Taken Arrow */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-[11px] text-slate-400 font-medium mb-1">Action Chosen</div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs shadow-inner">
            <span className="text-sm">{action_arrow}</span>
            <span>{action_name}</span>
          </div>
          {is_collision && (
            <span className="text-[10px] text-rose-400 font-bold mt-1 tracking-tight flex items-center space-x-0.5">
              <AlertTriangle className="w-3 h-3" />
              <span>COLLISION!</span>
            </span>
          )}
        </div>

        {/* Next Position */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-slate-400 font-medium">Next Position</span>
          <span
            className={`text-base font-bold font-mono mt-0.5 ${
              is_collision ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            ({next_position[0]}, {next_position[1]})
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[110px]" title={next_state_name}>
            {is_collision ? 'Remained in place' : next_state_name}
          </span>
        </div>
      </div>

      {/* Reason for Decision */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
        <span className="text-slate-400 font-semibold block mb-1">Reason for Decision:</span>
        <p className="text-slate-300 leading-relaxed font-sans">{decision_reason}</p>
      </div>

      {/* 4 Actions Q-Values Matrix Before vs After */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
          <span className="font-semibold text-slate-300">Action Q-Values Before & After</span>
          <span className="text-[11px] font-mono text-cyan-400">
            ΔQ: {deltaQ >= 0 ? `+${deltaQ.toFixed(4)}` : deltaQ.toFixed(4)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {actions.map((act, idx) => {
            const isSelected = act === action_name;
            const beforeVal = q_values_before ? q_values_before[idx] : 0;
            const afterVal = q_values_after ? q_values_after[idx] : beforeVal;

            return (
              <div
                key={act}
                className={`p-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 font-bold">{act}</div>
                <div className="text-xs font-mono font-bold mt-1 text-slate-200">
                  {afterVal.toFixed(3)}
                </div>
                {isSelected && (
                  <div className="text-[9px] font-mono text-cyan-400 mt-0.5">
                    ({beforeVal.toFixed(2)} → {afterVal.toFixed(2)})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bellman Formula Breakdown Card */}
      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs space-y-1.5 font-mono">
        <div className="flex items-center space-x-1.5 text-purple-300 font-bold font-sans">
          <Calculator className="w-3.5 h-3.5" />
          <span>Bellman Optimality Update Equation</span>
        </div>
        <div className="text-[11px] text-purple-200/90 leading-tight">
          Q(s, a) ← {old_q.toFixed(3)} + {alpha} × [{reward} + {gamma} × {next_max_q.toFixed(3)} - {old_q.toFixed(3)}]
        </div>
        <div className="text-[11px] text-cyan-300 font-bold">
          Updated Q(s, {action_name}) = {new_q.toFixed(4)}
        </div>
      </div>
    </div>
  );
};

