import React from 'react';
import { 
  Bot, 
  Terminal, 
  Activity, 
  AlertTriangle,
  RotateCw,
  Calculator
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const AgentInspector = () => {
  const { latestStep, historyIndex } = useQLearning();

  const actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  if (!latestStep) {
    return (
      <div className="p-4 rounded-[10px] bg-[#181B20] border border-[#282D35] flex flex-col items-center justify-center text-center h-[340px]">
        <Activity className="w-6 h-6 text-[#666D78] mb-2" />
        <h3 className="text-xs font-semibold text-[#E6E8EB] font-mono">Agent Idle</h3>
        <p className="text-[11px] text-[#9299A5] max-w-xs mt-1">
          Start simulation or step forward to inspect the agent's internal Q-values, reward signals, and decision rationale.
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
    old_q,
    new_q,
    q_values_before,
    q_values_after,
    state_name,
    decision_reason,
    thinking_text = [],
    is_recovery,
    recovery_action,
    next_max_q,
    alpha,
    gamma,
    action_visit_counts = {},
  } = latestStep;

  const deltaQ = new_q - old_q;

  return (
    <div className="p-4 rounded-[10px] bg-[#181B20] border border-[#282D35] space-y-3.5">
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#282D35]">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-[#5B8DEF]" />
          <h2 className="text-xs font-bold text-[#E6E8EB] uppercase tracking-wider font-mono">
            Agent Inspector
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-[#9299A5]">Step #{historyIndex >= 0 ? historyIndex + 1 : 1}</span>
          <span
            className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border ${
              reward > 0
                ? 'bg-[#45B880]/15 text-[#45B880] border-[#45B880]/40'
                : reward < -1
                ? 'bg-[#E15B64]/15 text-[#E15B64] border-[#E15B64]/40'
                : 'bg-[#21262D] text-[#9299A5] border-[#282D35]'
            }`}
          >
            Reward {reward > 0 ? `+${reward}` : reward}
          </span>
        </div>
      </div>

      {/* State & Transition Row */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-[6px] bg-[#14171B] border border-[#282D35] text-center font-mono text-xs">
        <div>
          <span className="text-[10px] text-[#666D78] block">State</span>
          <span className="text-sm font-bold text-[#5B8DEF] mt-0.5 block">
            ({current_position[0]}, {current_position[1]})
          </span>
          <span className="text-[9px] text-[#9299A5] truncate block">{state_name}</span>
        </div>

        <div className="border-x border-[#282D35] px-1">
          <span className="text-[10px] text-[#666D78] block">Action</span>
          <span className="text-sm font-bold text-[#E6E8EB] mt-0.5 inline-flex items-center space-x-1">
            <span>{action_arrow}</span>
            <span>{action_name}</span>
          </span>
          {is_collision ? (
            <span className="text-[9px] text-[#E15B64] font-semibold block">COLLISION</span>
          ) : is_recovery ? (
            <span className="text-[9px] text-[#E5A84B] font-semibold block">RECOVERY</span>
          ) : (
            <span className="text-[9px] text-[#45B880] block">VALID</span>
          )}
        </div>

        <div>
          <span className="text-[10px] text-[#666D78] block">Next Pos</span>
          <span
            className={`text-sm font-bold mt-0.5 block ${
              is_collision ? 'text-[#E5A84B]' : 'text-[#45B880]'
            }`}
          >
            ({next_position[0]}, {next_position[1]})
          </span>
          <span className="text-[9px] text-[#9299A5] block">
            {is_collision ? 'In Place' : 'Advanced'}
          </span>
        </div>
      </div>

      {/* Decision Rationale */}
      <div className="p-2.5 rounded-[6px] bg-[#14171B] border border-[#282D35] space-y-1">
        <span className="text-[10px] font-mono text-[#666D78] uppercase tracking-wider block">
          Decision Rationale
        </span>
        <p className="text-xs text-[#E6E8EB] leading-relaxed">
          {decision_reason}
        </p>
      </div>

      {/* 4 Action Q-Values & Attempt Counts */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#9299A5]">Action Values & Attempts N(s, a)</span>
          <span className="text-[#5B8DEF]">
            ΔQ: {deltaQ >= 0 ? `+${deltaQ.toFixed(4)}` : deltaQ.toFixed(4)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
          {actions.map((act, idx) => {
            const isSelected = act === action_name;
            const beforeVal = q_values_before ? q_values_before[idx] : 0;
            const afterVal = q_values_after ? q_values_after[idx] : beforeVal;
            const visits = action_visit_counts[act] ?? 0;

            return (
              <div
                key={act}
                className={`p-2 rounded-[6px] border transition-colors ${
                  isSelected
                    ? 'bg-[#21262D] border-[#5B8DEF] text-[#E6E8EB]'
                    : 'bg-[#14171B] border-[#282D35] text-[#9299A5]'
                }`}
              >
                <div className="text-[10px] text-[#666D78] font-bold">{act}</div>
                <div className="text-xs font-bold mt-0.5 text-[#E6E8EB]">
                  {afterVal.toFixed(2)}
                </div>
                <div className="text-[9px] text-[#666D78] mt-0.5">
                  {visits}x
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bellman Update Math Strip */}
      <div className="p-2.5 rounded-[6px] bg-[#14171B] border border-[#282D35] font-mono text-[11px] space-y-1">
        <div className="flex items-center space-x-1.5 text-[#8A7AFF] font-bold">
          <Calculator className="w-3.5 h-3.5" />
          <span>Bellman Update Equation</span>
        </div>
        <div className="text-[#9299A5] text-[10px]">
          Q(s,a) ← {old_q.toFixed(3)} + {alpha} × [{reward} + {gamma} × {next_max_q.toFixed(3)} - {old_q.toFixed(3)}]
        </div>
        <div className="text-[#5B8DEF] font-bold text-[11px]">
          New Q({current_position[0]},{current_position[1]}, {action_name}) = {new_q.toFixed(4)}
        </div>
      </div>
    </div>
  );
};

