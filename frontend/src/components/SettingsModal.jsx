import React, { useState } from 'react';
import { X, Settings, RotateCcw, Check, Brain, Sliders, RotateCw, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { useQLearning } from '../context/QLearningContext';

export const SettingsModal = () => {
  const { isSettingsOpen, setIsSettingsOpen, hyperparams, updateHyperparams } = useQLearning();

  const [form, setForm] = useState({
    learning_rate: hyperparams.learning_rate,
    discount_factor: hyperparams.discount_factor,
    epsilon: hyperparams.epsilon,
    epsilon_decay: hyperparams.epsilon_decay,
    epsilon_min: hyperparams.epsilon_min,
    state_mode: hyperparams.state_mode,
    loop_detection_enabled: hyperparams.loop_detection_enabled ?? true,
    recovery_enabled: hyperparams.recovery_enabled ?? true,
    max_episode_steps: hyperparams.max_episode_steps ?? 100,
    visitation_bonus_enabled: hyperparams.visitation_bonus_enabled ?? true,
    visitation_bonus_weight: 0.25,
    loop_penalty_enabled: hyperparams.loop_penalty_enabled ?? true,
    loop_penalty_amount: hyperparams.loop_penalty_amount ?? -1.5,
  });

  if (!isSettingsOpen) return null;

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    updateHyperparams({
      learning_rate: Number(form.learning_rate),
      discount_factor: Number(form.discount_factor),
      epsilon: Number(form.epsilon),
      epsilon_decay: Number(form.epsilon_decay),
      epsilon_min: Number(form.epsilon_min),
      state_mode: form.state_mode,
      loop_detection_enabled: Boolean(form.loop_detection_enabled),
      recovery_enabled: Boolean(form.recovery_enabled),
      max_episode_steps: Number(form.max_episode_steps),
      visitation_bonus_enabled: Boolean(form.visitation_bonus_enabled),
      loop_penalty_enabled: Boolean(form.loop_penalty_enabled),
      loop_penalty_amount: Number(form.loop_penalty_amount),
    });
    setIsSettingsOpen(false);
  };

  const handleResetDefaults = () => {
    const defaults = {
      learning_rate: 0.1,
      discount_factor: 0.95,
      epsilon: 1.0,
      epsilon_decay: 0.9995,
      epsilon_min: 0.05,
      state_mode: 'coordinate',
      loop_detection_enabled: true,
      recovery_enabled: true,
      max_episode_steps: 100,
      visitation_bonus_enabled: true,
      visitation_bonus_weight: 0.25,
      loop_penalty_enabled: true,
      loop_penalty_amount: -1.5,
    };
    setForm(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Settings className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Algorithm & Loop Recovery Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure Bellman update hyperparameters, exploration bonuses, and loop recovery
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 text-xs max-h-[65vh] overflow-y-auto pr-1">
          {/* Section: Anti-Loop & Recovery Systems */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Loop Prevention & Intelligent Recovery</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Anti-Oscillation</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.loop_detection_enabled}
                  onChange={(e) => handleChange('loop_detection_enabled', e.target.checked)}
                  className="rounded accent-amber-400"
                />
                <span className="text-slate-300 text-xs font-semibold">Enable Loop Detection</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recovery_enabled}
                  onChange={(e) => handleChange('recovery_enabled', e.target.checked)}
                  className="rounded accent-emerald-400"
                />
                <span className="text-slate-300 text-xs font-semibold">Intelligent Q-Recovery</span>
              </label>
            </div>

            {/* Visitation Bonus & Loop Penalty */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.visitation_bonus_enabled}
                    onChange={(e) => handleChange('visitation_bonus_enabled', e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                  <span>Exploration Bonus (Intrinsic Curiosity: r + β / √N)</span>
                </label>
                <span className="font-mono text-cyan-400 font-bold">{form.visitation_bonus_enabled ? 'Active' : 'Off'}</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.loop_penalty_enabled}
                    onChange={(e) => handleChange('loop_penalty_enabled', e.target.checked)}
                    className="rounded accent-rose-400"
                  />
                  <span>Re-visitation / Loop Churn Penalty ({form.loop_penalty_amount})</span>
                </label>
                <span className="font-mono text-rose-400 font-bold">{form.loop_penalty_enabled ? `${form.loop_penalty_amount}` : 'Off'}</span>
              </div>
            </div>
          </div>

          {/* State Representation Mode */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <label className="font-semibold text-slate-300 block">State Representation Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('state_mode', 'coordinate')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  form.state_mode === 'coordinate'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs">Cell Coordinates (Row, Col)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Classic fixed 6×6 grid tabular states (36 cells)</div>
              </button>

              <button
                type="button"
                onClick={() => handleChange('state_mode', 'local')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  form.state_mode === 'local'
                    ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-md shadow-purple-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs">Local Observation (3×3 + Goal)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Stage 3 generalizable sensor state representation</div>
              </button>
            </div>
          </div>

          {/* Learning Rate (Alpha) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Learning Rate (α)</label>
              <span className="font-mono text-cyan-400 font-bold">{form.learning_rate}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={form.learning_rate}
              onChange={(e) => handleChange('learning_rate', Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Discount Factor (Gamma) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Discount Factor (γ)</label>
              <span className="font-mono text-purple-400 font-bold">{form.discount_factor}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={form.discount_factor}
              onChange={(e) => handleChange('discount_factor', Number(e.target.value))}
              className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Epsilon Decay & Min */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Epsilon Decay Factor</label>
              <input
                type="number"
                step="0.0001"
                min="0.9"
                max="0.9999"
                value={form.epsilon_decay}
                onChange={(e) => handleChange('epsilon_decay', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Minimum Epsilon (ε_min)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.5"
                value={form.epsilon_min}
                onChange={(e) => handleChange('epsilon_min', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-950/50 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
