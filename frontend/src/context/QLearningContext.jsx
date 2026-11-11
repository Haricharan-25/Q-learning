import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';

const QLearningContext = createContext(null);

export const QLearningProvider = ({ children }) => {
  // Grid configuration
  const [gridSize, setGridSize] = useState(6);
  const [start, setStart] = useState([0, 0]);
  const [goal, setGoal] = useState([5, 5]);
  const [obstacles, setObstacles] = useState([[1, 1], [1, 2], [2, 4], [3, 1], [4, 3]]);
  const [editorMode, setEditorMode] = useState('obstacle'); // 'obstacle', 'start', 'goal'

  // Agent & simulation states
  const [agentPos, setAgentPos] = useState([0, 0]);
  const [simPath, setSimPath] = useState([[0, 0]]);
  const [simVisited, setSimVisited] = useState([[0, 0]]);
  const [simDone, setSimDone] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(350); // ms
  const [simMode, setSimMode] = useState('exploit'); // 'exploit', 'explore', 'train_step'
  
  // Replay history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [latestStep, setLatestStep] = useState(null);

  // Q-Table & Analytics data
  const [qTable, setQTable] = useState([]);
  const [selectedStateKey, setSelectedStateKey] = useState('(0, 0)');
  const [analytics, setAnalytics] = useState({
    episodes_history: [],
    key_states_history: {},
    total_episodes: 0,
    epsilon: 1.0,
    q_states_count: 0,
  });

  // Metadata & Status
  const [summary, setSummary] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Hyperparameters
  const [hyperparams, setHyperparams] = useState({
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
    loop_penalty_enabled: true,
    loop_penalty_amount: -1.5,
  });

  const [activeLoopInfo, setActiveLoopInfo] = useState(null);

  const wsRef = useRef(null);
  const simTimerRef = useRef(null);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => {
      setNotification((curr) => (curr?.msg === msg ? null : curr));
    }, 4000);
  };

  // Fetch initial status and Q-table
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setGridSize(data.grid_size);
        setStart(data.start);
        setGoal(data.goal);
        setObstacles(data.obstacles);
        setAgentPos(data.agent_position);
        setSimDone(data.sim_done);
        setSimPath(data.sim_path);
        setSimVisited(data.sim_visited);
        if (data.active_loop_info !== undefined) {
          setActiveLoopInfo(data.active_loop_info);
        }
        setHyperparams((prev) => ({
          ...prev,
          epsilon: data.epsilon ?? prev.epsilon,
          alpha: data.alpha ?? prev.alpha,
          gamma: data.gamma ?? prev.gamma,
          loop_detection_enabled: data.loop_detection_enabled ?? prev.loop_detection_enabled,
          recovery_enabled: data.recovery_enabled ?? prev.recovery_enabled,
          max_episode_steps: data.max_episode_steps ?? prev.max_episode_steps,
        }));
      }
    } catch (err) {
      console.warn('Backend status check:', err);
    }
  }, []);

  const fetchQTable = useCallback(async () => {
    try {
      const res = await fetch('/api/q-table');
      if (res.ok) {
        const data = await res.json();
        setQTable(data.table || []);
      }
    } catch (err) {
      console.warn('Fetch Q-table error:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.warn('Fetch analytics error:', err);
    }
  }, []);

  // Sync grid configuration to backend
  const syncGridToBackend = async (newObstacles, newStart, newGoal, keepQ = true) => {
    try {
      const res = await fetch('/api/grid/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grid_size: gridSize,
          start: newStart || start,
          goal: newGoal || goal,
          obstacles: newObstacles || obstacles,
          keep_q_table: keepQ,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setAgentPos(data.agent_position);
        setSimDone(false);
        setSimPath([data.start]);
        setSimVisited([data.start]);
        setHistory([]);
        setHistoryIndex(-1);
        setLatestStep(null);
        setActiveLoopInfo(null);
        fetchQTable();
      }
    } catch (err) {
      notify('Failed to update grid layout: ' + err.message, 'error');
    }
  };

  // Toggle cell obstacle or set start/goal
  const handleCellClick = (r, c) => {
    if (simRunning) return;

    if (editorMode === 'start') {
      if ((r === goal[0] && c === goal[1]) || obstacles.some(([or, oc]) => or === r && oc === c)) {
        notify('Cannot place start on an obstacle or goal cell.', 'warning');
        return;
      }
      setStart([r, c]);
      setAgentPos([r, c]);
      syncGridToBackend(obstacles, [r, c], goal, true);
      notify(`Start point set to (${r}, ${c})`, 'success');
      return;
    }

    if (editorMode === 'goal') {
      if ((r === start[0] && c === start[1]) || obstacles.some(([or, oc]) => or === r && oc === c)) {
        notify('Cannot place goal on an obstacle or start cell.', 'warning');
        return;
      }
      setGoal([r, c]);
      syncGridToBackend(obstacles, start, [r, c], true);
      notify(`Goal point set to (${r}, ${c})`, 'success');
      return;
    }

    // Default: toggle obstacle
    if ((r === start[0] && c === start[1]) || (r === goal[0] && c === goal[1])) {
      notify('Start and goal cells cannot become obstacles.', 'warning');
      return;
    }

    const exists = obstacles.some(([or, oc]) => or === r && oc === c);
    let nextObs;
    if (exists) {
      nextObs = obstacles.filter(([or, oc]) => !(or === r && oc === c));
    } else {
      nextObs = [...obstacles, [r, c]];
    }
    setObstacles(nextObs);
    syncGridToBackend(nextObs, start, goal, true);
  };

  // Randomize obstacles
  const generateRandomObstacles = async (prob = 0.2) => {
    try {
      const res = await fetch('/api/grid/generate-obstacles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ probability: prob }),
      });
      if (res.ok) {
        const data = await res.json();
        setObstacles(data.obstacles);
        setSummary(data);
        setAgentPos(data.start);
        setSimPath([data.start]);
        setSimVisited([data.start]);
        setSimDone(false);
        setHistory([]);
        setHistoryIndex(-1);
        setLatestStep(null);
        setActiveLoopInfo(null);
        notify('Random obstacles generated with valid start & goal preserved.', 'success');
        fetchQTable();
      }
    } catch (err) {
      notify('Failed to generate random obstacles: ' + err.message, 'error');
    }
  };

  const clearObstacles = () => {
    setObstacles([]);
    syncGridToBackend([], start, goal, true);
    notify('All obstacles cleared.', 'info');
  };

  const resetSimulation = async () => {
    setSimRunning(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setAgentPos(data.start);
        setSimPath([data.start]);
        setSimVisited([data.start]);
        setSimDone(false);
        setHistory([]);
        setHistoryIndex(-1);
        setLatestStep(null);
        setActiveLoopInfo(null);
      }
    } catch (err) {
      console.warn('Reset sim error:', err);
    }
  };

  const resetAgent = async () => {
    setSimRunning(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    try {
      const res = await fetch('/api/simulation/reset-agent', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setAgentPos(data.start);
        setSimPath([data.start]);
        setSimVisited([data.start]);
        setSimDone(false);
        setHistory([]);
        setHistoryIndex(-1);
        setLatestStep(null);
        setActiveLoopInfo(null);
        fetchQTable();
        fetchAnalytics();
        notify('Agent Q-table and training metrics reset to initial state.', 'info');
      }
    } catch (err) {
      notify('Failed to reset agent: ' + err.message, 'error');
    }
  };

  // Step Forward simulation
  const stepForward = async (actionOverride = null) => {
    // If we are currently reviewing a past history step, stepping forward moves along existing history
    if (historyIndex >= 0 && historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const stepData = history[nextIdx];
      setHistoryIndex(nextIdx);
      setLatestStep(stepData);
      setAgentPos(stepData.next_position);
      setSimPath(stepData.path);
      setSimVisited(stepData.visited);
      setSimDone(stepData.done);
      return stepData;
    }

    try {
      const res = await fetch('/api/simulation/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: simMode,
          action: actionOverride,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const step = data.step;
        if (step.message && step.done) {
          notify('Simulation reached goal or maximum step limit.', 'info');
          setSimRunning(false);
          return null;
        }

        setLatestStep(step);
        setSummary(data.summary);
        setAgentPos(step.next_position);
        setSimPath(step.path);
        setSimVisited(step.visited);
        setSimDone(step.done);

        if (step.loop_detected) {
          setActiveLoopInfo(step.loop_info);
          if (step.is_recovery) {
            notify(`🔁 Loop detected! Activated intelligent recovery via ${step.recovery_action}.`, 'warning');
          } else {
            notify(`🔁 Loop detected (${step.loop_info?.title}). Recovery is disabled.`, 'warning');
          }
        } else {
          setActiveLoopInfo(null);
        }

        // Update history
        const newHist = [...history, step];
        setHistory(newHist);
        setHistoryIndex(newHist.length - 1);

        if (step.done) {
          setSimRunning(false);
          if (step.reached_goal) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
            notify('🎉 Goal Reached! Terminal reward +100.0 received.', 'success');
          } else {
            notify('Simulation ended.', 'info');
          }
        }

        // Live update Q-table in view
        fetchQTable();
        return step;
      }
    } catch (err) {
      console.warn('Step error:', err);
      setSimRunning(false);
    }
    return null;
  };

  // Step Backward simulation (Replay)
  const stepBackward = () => {
    if (history.length === 0 || historyIndex <= 0) {
      // Reached beginning of history
      setHistoryIndex(-1);
      setAgentPos(start);
      setSimPath([start]);
      setLatestStep(null);
      setSimDone(false);
      return;
    }

    const prevIdx = historyIndex - 1;
    const prevStep = history[prevIdx];
    setHistoryIndex(prevIdx);
    setLatestStep(prevStep);
    setAgentPos(prevStep.next_position);
    setSimPath(prevStep.path);
    setSimVisited(prevStep.visited);
    setSimDone(prevStep.done);
  };

  // Start / Pause simulation
  const startSimulation = () => {
    if (simDone) {
      resetSimulation().then(() => {
        setSimRunning(true);
      });
    } else {
      setSimRunning(true);
    }
  };

  const pauseSimulation = () => {
    setSimRunning(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
  };

  // Auto-run loop for simulation
  useEffect(() => {
    if (simRunning) {
      simTimerRef.current = setInterval(async () => {
        const step = await stepForward();
        if (!step || step.done) {
          setSimRunning(false);
          clearInterval(simTimerRef.current);
        }
      }, simSpeed);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [simRunning, simSpeed, historyIndex, history, simMode]);

  // Train agent batch
  const trainAgent = async (episodes = 500) => {
    setIsTraining(true);
    setTrainProgress({ completed: 0, total: episodes });
    try {
      const res = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodes, max_steps: 100 }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        notify(
          `Trained ${episodes} episodes! Success Rate: ${data.batch_result.success_rate}%, Avg Reward: ${data.batch_result.avg_reward}`,
          'success'
        );
        await fetchQTable();
        await fetchAnalytics();
        await resetSimulation();
      }
    } catch (err) {
      notify('Training failed: ' + err.message, 'error');
    } finally {
      setIsTraining(false);
      setTrainProgress(null);
    }
  };

  // Update Settings
  const updateHyperparams = async (newParams) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParams),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setHyperparams((prev) => ({ ...prev, ...newParams }));
        notify('Settings updated successfully.', 'success');
        fetchQTable();
        fetchAnalytics();
      }
    } catch (err) {
      notify('Failed to save settings: ' + err.message, 'error');
    }
  };

  const toggleLoopDetection = async () => {
    const newVal = !hyperparams.loop_detection_enabled;
    await updateHyperparams({ loop_detection_enabled: newVal });
    notify(`Loop Detection turned ${newVal ? 'ON' : 'OFF'}.`, 'info');
  };

  const toggleRecovery = async () => {
    const newVal = !hyperparams.recovery_enabled;
    await updateHyperparams({ recovery_enabled: newVal });
    notify(`Intelligent Recovery turned ${newVal ? 'ON' : 'OFF'}.`, 'info');
  };

  const setMaxEpisodeSteps = async (steps) => {
    await updateHyperparams({ max_episode_steps: Number(steps) });
    notify(`Max episode steps set to ${steps}.`, 'info');
  };

  const setEpsilonDirect = async (val) => {
    await updateHyperparams({ epsilon: Number(val) });
  };

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchQTable();
    fetchAnalytics();
  }, [fetchStatus, fetchQTable, fetchAnalytics]);

  return (
    <QLearningContext.Provider
      value={{
        gridSize,
        setGridSize,
        start,
        goal,
        obstacles,
        editorMode,
        setEditorMode,
        handleCellClick,
        generateRandomObstacles,
        clearObstacles,
        agentPos,
        simPath,
        simVisited,
        simDone,
        simRunning,
        simSpeed,
        setSimSpeed,
        simMode,
        setSimMode,
        startSimulation,
        pauseSimulation,
        stepForward,
        stepBackward,
        resetSimulation,
        resetAgent,
        history,
        historyIndex,
        latestStep,
        qTable,
        selectedStateKey,
        setSelectedStateKey,
        analytics,
        summary,
        isTraining,
        trainProgress,
        trainAgent,
        hyperparams,
        updateHyperparams,
        activeLoopInfo,
        toggleLoopDetection,
        toggleRecovery,
        setMaxEpisodeSteps,
        setEpsilonDirect,
        isSettingsOpen,
        setIsSettingsOpen,
        notification,
        notify,
        fetchQTable,
        fetchAnalytics,
      }}
    >
      {children}
    </QLearningContext.Provider>
  );
};

export const useQLearning = () => {
  const context = useContext(QLearningContext);
  if (!context) {
    throw new Error('useQLearning must be used within a QLearningProvider');
  }
  return context;
};

