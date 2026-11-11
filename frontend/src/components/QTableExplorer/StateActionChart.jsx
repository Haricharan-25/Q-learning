import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { Star, Award, BarChart3, RotateCw, Sparkles, Activity } from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const StateActionChart = ({ selectedStateData }) => {
  const { latestStep } = useQLearning();

  if (!selectedStateData) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center text-center h-72">
        <BarChart3 className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-300">No State Selected</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Select a state from the table or click on a cell to compare action Q-values.
        </p>
      </div>
    );
  }

  const {
    state_name,
    up,
    down,
    left,
    right,
    max_q,
    best_action,
    up_visits = 0,
    down_visits = 0,
    left_visits = 0,
    right_visits = 0,
    is_in_loop = false,
    loop_trigger_action = null,
  } = selectedStateData;

  const recoveryAction = latestStep?.is_recovery ? latestStep.recovery_action : null;

  const chartData = [
    { 
      action: 'UP (0)', 
      value: up, 
      isBest: up === max_q && up !== 0, 
      rawName: 'UP', 
      visits: up_visits,
      isLoop: is_in_loop && loop_trigger_action === 'UP',
      isRecovery: recoveryAction === 'UP'
    },
    { 
      action: 'DOWN (1)', 
      value: down, 
      isBest: down === max_q && down !== 0, 
      rawName: 'DOWN', 
      visits: down_visits,
      isLoop: is_in_loop && loop_trigger_action === 'DOWN',
      isRecovery: recoveryAction === 'DOWN'
    },
    { 
      action: 'LEFT (2)', 
      value: left, 
      isBest: left === max_q && left !== 0, 
      rawName: 'LEFT', 
      visits: left_visits,
      isLoop: is_in_loop && loop_trigger_action === 'LEFT',
      isRecovery: recoveryAction === 'LEFT'
    },
    { 
      action: 'RIGHT (3)', 
      value: right, 
      isBest: right === max_q && right !== 0, 
      rawName: 'RIGHT', 
      visits: right_visits,
      isLoop: is_in_loop && loop_trigger_action === 'RIGHT',
      isRecovery: recoveryAction === 'RIGHT'
    },
  ];

  const getColor = (item) => {
    if (item.isLoop) return '#f59e0b'; // amber for loop trigger
    if (item.isRecovery) return '#10b981'; // emerald for recovery
    if (item.isBest) return '#06b6d4'; // cyan for best
    if (item.value < 0) return '#f43f5e'; // rose red
    if (item.value > 0) return '#38bdf8'; // light cyan
    return '#64748b'; // slate for zero
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1 font-mono">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">{data.action}</span>
            {data.isBest && (
              <span className="flex items-center text-[10px] text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-600/40">
                <Star className="w-2.5 h-2.5 mr-0.5 fill-cyan-400" /> Best
              </span>
            )}
            {data.isLoop && (
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-1.5 py-0.2 rounded border border-amber-600/40">
                Loop Trigger
              </span>
            )}
          </div>
          <div className="text-slate-300">
            Q-Value: <span className="font-bold text-cyan-300">{data.value.toFixed(4)}</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Attempt Count: <span className="font-bold text-white">{data.visits}</span> times
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
      {/* Title & Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white tracking-wide">Action Values & Attempts</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              {state_name}
            </span>
            {is_in_loop && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse">
                Looping Cell
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Learned expected returns and state-action visitation counts N(s, a)
          </p>
        </div>

        {best_action !== 'NONE' && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-inner">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Optimal: {best_action}</span>
            <span className="font-mono text-[11px] ml-1">({max_q.toFixed(2)})</span>
          </div>
        )}
      </div>

      {/* Bar Chart Container */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
            <XAxis
              dataKey="action"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(entry)}
                  stroke={entry.isLoop ? '#fbbf24' : (entry.isBest ? '#38bdf8' : 'transparent')}
                  strokeWidth={entry.isLoop || entry.isBest ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* State-Action Attempt Counts Strip */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-center font-mono text-[11px]">
        {chartData.map((d, i) => (
          <div key={i} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-sans">{d.rawName} Attempts</div>
            <div className="font-bold text-slate-200 mt-0.5">{d.visits}x</div>
          </div>
        ))}
      </div>
    </div>
  );
};
