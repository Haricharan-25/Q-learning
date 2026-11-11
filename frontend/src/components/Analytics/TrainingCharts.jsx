import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  Zap, 
  Activity, 
  Compass, 
  Award,
  Layers
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const TrainingCharts = () => {
  const { 
    analytics, 
    trainAgent, 
    isTraining, 
    trainProgress, 
    summary 
  } = useQLearning();

  const [episodesToTrain, setEpisodesToTrain] = useState(500);

  const history = analytics.episodes_history || [];
  const keyStatesHistory = analytics.key_states_history?.start || [];

  // Format start state Q-values for Chart 4
  const startStateChartData = keyStatesHistory.map((item) => ({
    episode: item.episode,
    UP: item.values?.[0] ?? 0,
    DOWN: item.values?.[1] ?? 0,
    LEFT: item.values?.[2] ?? 0,
    RIGHT: item.values?.[3] ?? 0,
    MaxQ: item.max_q ?? 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-xs space-y-1 font-mono">
          <div className="text-slate-400 font-bold">Episode {label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-bold text-white">
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Interactive Training Trigger Bar */}
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Interactive Training Controller</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Train the Q-learning agent across multiple episodes to generate convergence analytics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {[100, 500, 1000, 3000].map((num) => (
              <button
                key={num}
                onClick={() => setEpisodesToTrain(num)}
                className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
                  episodesToTrain === num
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={() => trainAgent(episodesToTrain)}
            disabled={isTraining}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/50 border border-cyan-400/30 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isTraining ? 'Training in Progress...' : `Run +${episodesToTrain} Episodes`}</span>
          </button>
        </div>
      </div>

      {/* Grid of 4 Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Graph 1: Reward vs Episode */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>1. Reward vs Episode</span>
              </h4>
              <p className="text-[11px] text-slate-400">Total accumulated reward per episode</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Bellman Return
            </span>
          </div>

          <div className="h-64 w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="episode" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="reward"
                    name="Episode Reward"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rewardGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No episode data yet. Click "Run Episodes" to start learning.
              </div>
            )}
          </div>
        </div>

        {/* Graph 2: Success Rate vs Episode */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>2. Success Rate vs Episode</span>
              </h4>
              <p className="text-[11px] text-slate-400">Cumulative goal completion percentage</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Convergence Metric
            </span>
          </div>

          <div className="h-64 w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="episode" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" domain={[0, 100]} fontSize={11} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="success_rate"
                    name="Success Rate %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No episode data yet. Click "Run Episodes" to start learning.
              </div>
            )}
          </div>
        </div>

        {/* Graph 3: Epsilon Decay */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>3. Epsilon Decay (Exploration vs Exploitation)</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Decays from 1.0 down to min 0.05 via decay factor
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
              ε-Schedule
            </span>
          </div>

          <div className="h-64 w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="epsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="episode" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" domain={[0, 1.0]} fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="epsilon"
                    name="Epsilon (ε)"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#epsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No episode data yet. Click "Run Episodes" to start learning.
              </div>
            )}
          </div>
        </div>

        {/* Graph 4: Q-Values over Time for Start State */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>4. Q-Values Over Time (Start State (0, 0))</span>
              </h4>
              <p className="text-[11px] text-slate-400">Action values evolving toward optimal values</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
              State Q-Evolution
            </span>
          </div>

          <div className="h-64 w-full">
            {startStateChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={startStateChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="episode" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="UP" stroke="#f43f5e" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="DOWN" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="LEFT" stroke="#ec4899" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="RIGHT" stroke="#10b981" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="MaxQ" stroke="#fbbf24" strokeDasharray="4 4" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Train at least 5 episodes to plot state value trajectory.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

