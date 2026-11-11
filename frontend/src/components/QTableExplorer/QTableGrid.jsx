import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Bot, 
  CheckCircle2,
  ChevronRight,
  RotateCw,
  AlertTriangle,
  History
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const QTableGrid = ({ onSelectState, selectedStateId }) => {
  const { 
    qTable, 
    latestStep, 
    agentPos, 
    start, 
    goal, 
    simVisited, 
    history,
    activeLoopInfo,
  } = useQLearning();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'visited', 'non_zero', 'loop'

  const getQValueStyle = (val, isSelectedAction, isLoopAction) => {
    let colorClass = 'text-slate-400';
    let bgClass = 'bg-slate-900/40';

    if (val < 0) {
      if (val <= -2) {
        colorClass = 'text-rose-400 font-bold';
        bgClass = 'bg-rose-950/40';
      } else {
        colorClass = 'text-rose-300';
        bgClass = 'bg-rose-950/20';
      }
    } else if (val > 0) {
      if (val >= 10) {
        colorClass = 'text-emerald-400 font-extrabold';
        bgClass = 'bg-emerald-950/50';
      } else if (val >= 1) {
        colorClass = 'text-teal-300 font-bold';
        bgClass = 'bg-teal-950/30';
      } else {
        colorClass = 'text-amber-300 font-semibold';
        bgClass = 'bg-amber-950/20';
      }
    }

    if (isLoopAction) {
      bgClass += ' ring-2 ring-amber-500 shadow-md shadow-amber-950';
    } else if (isSelectedAction) {
      bgClass += ' ring-2 ring-cyan-400 shadow-md shadow-cyan-950';
    }

    return `${colorClass} ${bgClass}`;
  };

  const filteredStates = useMemo(() => {
    return qTable.filter((item) => {
      // Search filter
      const matchSearch =
        item.state_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.state_key.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      // Category filter
      if (filterMode === 'visited') {
        return item.visited;
      }
      if (filterMode === 'non_zero') {
        return item.up !== 0 || item.down !== 0 || item.left !== 0 || item.right !== 0;
      }
      if (filterMode === 'loop') {
        return item.is_in_loop;
      }
      return true;
    });
  }, [qTable, searchQuery, filterMode]);

  return (
    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
      {/* Table Header & State Selection Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white tracking-wide">Q-Table Matrix</h3>
            {activeLoopInfo && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <RotateCw className="w-3 h-3" />
                <span>Loop Active</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {qTable.length} distinct states mapped • Click any row to inspect & compare action values
          </p>
        </div>

        {/* Quick Selection Shortcuts */}
        <div className="flex items-center space-x-2">
          {/* Select Current Agent Position */}
          <button
            onClick={() => {
              const currentItem = qTable.find((s) => s.is_agent);
              if (currentItem) onSelectState(currentItem);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 transition-all"
            title="Inspect current agent state"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agent ({agentPos[0]},{agentPos[1]})</span>
          </button>

          {/* Filter Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterMode === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('visited')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterMode === 'visited' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              Visited
            </button>
            <button
              onClick={() => setFilterMode('non_zero')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                filterMode === 'non_zero' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              Learned
            </button>
            {activeLoopInfo && (
              <button
                onClick={() => setFilterMode('loop')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  filterMode === 'loop' ? 'bg-amber-500/30 text-amber-300 font-bold' : 'text-amber-400/70'
                }`}
              >
                Looped
              </button>
            )}
          </div>
        </div>
      </div>

      {/* State History Quick Picker (Recent Trajectory States) */}
      {history.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 flex items-center space-x-1 text-[11px] flex-shrink-0">
            <History className="w-3 h-3 text-cyan-400" />
            <span>Trajectory:</span>
          </span>
          <div className="flex items-center space-x-1.5 flex-nowrap">
            {history.slice(-8).map((step, idx) => {
              const coord = step.current_position;
              const matchingRow = qTable.find((r) => r.state_name === step.state_name);
              return (
                <button
                  key={idx}
                  onClick={() => matchingRow && onSelectState(matchingRow)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 flex-shrink-0"
                >
                  ({coord[0]},{coord[1]}) {step.action_arrow}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search state e.g. '(2, 3)' or 'Cell (0, 0)'..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Table Container with custom scrollbar */}
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3 text-center">UP (0)</th>
              <th className="py-2.5 px-3 text-center">DOWN (1)</th>
              <th className="py-2.5 px-3 text-center">LEFT (2)</th>
              <th className="py-2.5 px-3 text-center">RIGHT (3)</th>
              <th className="py-2.5 px-3 text-center">Optimal Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredStates.map((row) => {
              const isSelected = selectedStateId === row.id;
              const isCurrentAgentState = row.is_agent;
              const isCurrentStepState =
                latestStep && row.state_name === latestStep.state_name;
              const currentAction = latestStep?.action_name;
              const isLoopRow = row.is_in_loop;

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectState(row)}
                  className={`cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-l-4 border-cyan-400'
                      : isLoopRow
                      ? 'bg-amber-950/20 border-l-4 border-amber-500 hover:bg-amber-950/30'
                      : isCurrentAgentState
                      ? 'bg-slate-900/60 hover:bg-slate-850'
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  {/* State Name */}
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      {isCurrentAgentState && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      )}
                      <span
                        className={`font-semibold ${
                          isSelected
                            ? 'text-cyan-300 font-bold'
                            : isLoopRow
                            ? 'text-amber-300 font-bold'
                            : isCurrentAgentState
                            ? 'text-cyan-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.state_name}
                      </span>
                      {isLoopRow && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50 font-bold">
                          LOOP
                        </span>
                      )}
                      {row.cell_type === 'start' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                          START
                        </span>
                      )}
                      {row.cell_type === 'goal' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-700/50">
                          GOAL
                        </span>
                      )}
                      {row.cell_type === 'obstacle' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          OBSTACLE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* UP Action */}
                  <td className="py-2 px-3 text-center">
                    <div
                      className={`inline-flex flex-col items-center px-2 py-0.5 rounded-lg text-xs transition-all ${getQValueStyle(
                        row.up,
                        isCurrentStepState && currentAction === 'UP',
                        isLoopRow && row.loop_trigger_action === 'UP'
                      )}`}
                    >
                      <span>{row.up.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-500 font-sans">{row.up_visits}x</span>
                    </div>
                  </td>

                  {/* DOWN Action */}
                  <td className="py-2 px-3 text-center">
                    <div
                      className={`inline-flex flex-col items-center px-2 py-0.5 rounded-lg text-xs transition-all ${getQValueStyle(
                        row.down,
                        isCurrentStepState && currentAction === 'DOWN',
                        isLoopRow && row.loop_trigger_action === 'DOWN'
                      )}`}
                    >
                      <span>{row.down.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-500 font-sans">{row.down_visits}x</span>
                    </div>
                  </td>

                  {/* LEFT Action */}
                  <td className="py-2 px-3 text-center">
                    <div
                      className={`inline-flex flex-col items-center px-2 py-0.5 rounded-lg text-xs transition-all ${getQValueStyle(
                        row.left,
                        isCurrentStepState && currentAction === 'LEFT',
                        isLoopRow && row.loop_trigger_action === 'LEFT'
                      )}`}
                    >
                      <span>{row.left.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-500 font-sans">{row.left_visits}x</span>
                    </div>
                  </td>

                  {/* RIGHT Action */}
                  <td className="py-2 px-3 text-center">
                    <div
                      className={`inline-flex flex-col items-center px-2 py-0.5 rounded-lg text-xs transition-all ${getQValueStyle(
                        row.right,
                        isCurrentStepState && currentAction === 'RIGHT',
                        isLoopRow && row.loop_trigger_action === 'RIGHT'
                      )}`}
                    >
                      <span>{row.right.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-500 font-sans">{row.right_visits}x</span>
                    </div>
                  </td>

                  {/* Best Action */}
                  <td className="py-2 px-3 text-center">
                    {row.best_action !== 'NONE' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 border border-slate-800 text-cyan-300">
                        {row.best_action} ({row.max_q.toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Color Scale Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
            <span>Negative Q (Collision)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
            <span>Small Positive Q</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400"></span>
            <span>High Positive Q</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded ring-2 ring-amber-400 bg-amber-950"></span>
            <span>Loop Trigger Action</span>
          </div>
        </div>

        <span className="text-slate-500">Click any row to view action bar chart</span>
      </div>
    </div>
  );
};
