import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Zap,
  Dices,
  Trash2,
  Sliders,
  ShieldAlert,
  MapPin,
  Flag,
  Brain,
  RotateCw,
  ShieldCheck,
  Compass,
  Layers
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const GridControls = () => {
  const {
    editorMode,
    setEditorMode,
    generateRandomObstacles,
    clearObstacles,
    simRunning,
    startSimulation,
    pauseSimulation,
    stepForward,
    stepBackward,
    resetSimulation,
    resetAgent,
    simSpeed,
    setSimSpeed,
    simMode,
    setSimMode,
    trainAgent,
    isTraining,
    history,
    historyIndex,
    summary,
    hyperparams,
    toggleLoopDetection,
    toggleRecovery,
    setMaxEpisodeSteps,
    setEpsilonDirect,
  } = useQLearning();

  const currentEps = summary?.epsilon ?? hyperparams.epsilon ?? 1.0;
  const maxSteps = hyperparams.max_episode_steps ?? 100;

  return (
    <div className="flex flex-col space-y-4">
      {/* Panel 1: Manual Grid Editor */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h3 className="text-sm font-bold text-white tracking-wide">Manual Grid Editor</h3>
          </div>
          <span className="text-[11px] text-slate-400">Click cells on grid to apply</span>
        </div>

        {/* Editor Mode Selector */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => setEditorMode('obstacle')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              editorMode === 'obstacle'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Obstacle (#)</span>
          </button>

          <button
            onClick={() => setEditorMode('start')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              editorMode === 'start'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-md shadow-emerald-950/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Set Start (S)</span>
          </button>

          <button
            onClick={() => setEditorMode('goal')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              editorMode === 'goal'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-md shadow-amber-950/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Set Goal (G)</span>
          </button>
        </div>

        {/* Quick Grid Generators */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => generateRandomObstacles(0.20)}
            disabled={simRunning || isTraining}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-medium text-slate-300 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all duration-150 disabled:opacity-50"
          >
            <Dices className="w-3.5 h-3.5 text-cyan-400" />
            <span>Random Obstacles (20%)</span>
          </button>

          <button
            onClick={clearObstacles}
            disabled={simRunning || isTraining}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-medium text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 hover:border-rose-700/60 transition-all duration-150 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Obstacles</span>
          </button>
        </div>
      </div>

      {/* Panel 2: Simulation Control Deck */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <h3 className="text-sm font-bold text-white tracking-wide">Simulation Controls</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Step:</span>
            <span className="font-mono text-cyan-300 font-bold">
              {historyIndex >= 0 ? historyIndex + 1 : 0} / {history.length}
            </span>
          </div>
        </div>

        {/* Training Action Row */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center space-x-1.5 font-medium">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Train Agent on Grid:</span>
            </span>
            <span className="text-purple-300 font-mono text-[11px]">
              {summary?.training_episodes || 0} episodes done
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => trainAgent(100)}
              disabled={isTraining || simRunning}
              className="py-1.5 px-2 rounded-lg text-xs font-semibold text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/60 transition-all disabled:opacity-50"
            >
              +100 Ep
            </button>
            <button
              onClick={() => trainAgent(500)}
              disabled={isTraining || simRunning}
              className="py-1.5 px-2 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 transition-all disabled:opacity-50"
            >
              +500 Ep
            </button>
            <button
              onClick={() => trainAgent(2000)}
              disabled={isTraining || simRunning}
              className="py-1.5 px-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 transition-all disabled:opacity-50"
            >
              +2000 Ep
            </button>
          </div>
        </div>

        {/* Primary Playback Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {/* Step Back */}
          <button
            onClick={stepBackward}
            disabled={history.length === 0 || historyIndex <= 0 || simRunning}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Step backward in simulation history"
          >
            <SkipBack className="w-4 h-4 mb-1 text-slate-400" />
            <span>Step Back</span>
          </button>

          {/* Play / Pause Toggle */}
          {simRunning ? (
            <button
              onClick={pauseSimulation}
              className="col-span-2 flex items-center justify-center space-x-2 p-2.5 rounded-xl text-xs font-bold text-amber-200 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-600/70 shadow-lg shadow-amber-950/50 transition-all"
            >
              <Pause className="w-4 h-4 fill-amber-300" />
              <span>Pause Sim</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="col-span-2 flex items-center justify-center space-x-2 p-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Sim</span>
            </button>
          )}

          {/* Step Forward */}
          <button
            onClick={() => stepForward()}
            disabled={simRunning}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Step forward one action"
          >
            <SkipForward className="w-4 h-4 mb-1 text-cyan-400" />
            <span>Step Next</span>
          </button>
        </div>

        {/* Secondary Reset Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={resetSimulation}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Position</span>
          </button>

          <button
            onClick={resetAgent}
            disabled={isTraining}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-medium text-rose-300 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset Q-Table</span>
          </button>
        </div>

        {/* Loop Detection & Recovery Control Row */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-bold text-slate-300 flex items-center space-x-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Loop & Recovery Controls</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Max {maxSteps} Steps
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Loop Detection Toggle */}
            <button
              onClick={toggleLoopDetection}
              className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                hyperparams.loop_detection_enabled
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
            >
              <span>Loop Detection</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                hyperparams.loop_detection_enabled ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
              }`}>
                {hyperparams.loop_detection_enabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Intelligent Recovery Toggle */}
            <button
              onClick={toggleRecovery}
              className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                hyperparams.recovery_enabled
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
            >
              <span>Auto-Recovery</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                hyperparams.recovery_enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
              }`}>
                {hyperparams.recovery_enabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Max Episode Steps selector */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">Max Episode Steps:</span>
            <div className="flex items-center space-x-1 font-mono">
              {[50, 100, 200, 300].map((steps) => (
                <button
                  key={steps}
                  onClick={() => setMaxEpisodeSteps(steps)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                    maxSteps === steps
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {steps}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Exploration (Epsilon) Slider */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Exploration Rate (ε):</span>
            </span>
            <span className="font-mono text-purple-300 font-bold text-xs">
              {Number(currentEps).toFixed(3)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-500">0.05</span>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={currentEps}
              onChange={(e) => setEpsilonDirect(Number(e.target.value))}
              className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">1.0</span>
          </div>
        </div>

        {/* Speed Slider & Policy Mode */}
        <div className="pt-2 border-t border-slate-800/60 space-y-3">
          {/* Speed Selector */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Simulation Speed:</span>
              <span className="font-mono text-cyan-300 font-semibold">{simSpeed} ms/step</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500">Fast</span>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Slow</span>
            </div>
          </div>

          {/* Action Decision Policy */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Decision Policy:</span>
              <span className="font-mono text-purple-300 text-[11px] capitalize">{simMode}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setSimMode('exploit')}
                className={`py-1 px-2 rounded-lg text-[11px] font-medium border transition-all ${
                  simMode === 'exploit'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Greedy Policy
              </button>
              <button
                onClick={() => setSimMode('explore')}
                className={`py-1 px-2 rounded-lg text-[11px] font-medium border transition-all ${
                  simMode === 'explore'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                ε-Exploration
              </button>
              <button
                onClick={() => setSimMode('train_step')}
                className={`py-1 px-2 rounded-lg text-[11px] font-medium border transition-all ${
                  simMode === 'train_step'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Live Learn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
