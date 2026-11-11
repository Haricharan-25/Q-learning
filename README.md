# Interactive Q-Learning Grid Visualizer (AI Lab)

An interactive, educational reinforcement learning visualizer built on top of the tabular Q-Learning grid navigation algorithm.

Designed with a modern AI research dashboard interface featuring glassmorphic panels, real-time Bellman optimality derivations, dynamic Q-table heatmaps, obstacle collision animations, and convergence analytics.

---

## 🚀 Key Features

### 1. Grid Simulator (Page 1)
- **Interactive 6×6 Grid**: Manually place/remove obstacles (`#`), move start position (`S`), and move goal position (`G`).
- **Obstacle Collision Mechanics (Section 3)**:
  - Highlights obstacle cell in pulsing red on collision.
  - Directional vector arrows indicating the attempted action.
  - Floating collision penalty badge (`-5.0`).
  - Agent remains in original position without arbitrary reversal.
  - Q-value for attempted action is penalized according to the Bellman equation, reducing probability of choosing it in future visits.
- **Playback Controls**:
  - Start Training (`+100`, `+500`, `+2000` episodes)
  - Start / Pause / Resume live simulation
  - Step Forward & Step Backward (instant replay from trajectory history)
  - Reset Position & Reset Q-Table
  - Speed Slider (50ms – 1000ms per step)
- **Agent Thinking Panel (Section 7)**:
  - Algorithm-faithful reasoning stream reflecting actual state, local sensing, action decision (greedy vs $\epsilon$-exploration), reward received, and mathematical Q-value update.
- **Real-Time Step Telemetry**:
  - Current Position, Action Selected, Next Position, Transition Reward, Bellman Equation breakdown.

### 2. Live Q-Table Explorer (Page 2)
- **Dynamic Q-Matrix**: Complete tabular representation for all 4 cardinal actions (`UP`, `DOWN`, `LEFT`, `RIGHT`).
- **Heatmap Color Coding**:
  - Red: Negative Q-values (penalties & collisions)
  - Slate: Unvisited zero values
  - Yellow: Small positive returns
  - Vibrant Emerald Green: High positive returns (optimal path to goal)
- **Dynamic Updates**:
  - Active agent state highlighted with glowing pulse.
  - Active action highlighted in real-time.
  - Displays Old Q, Reward, Next Max Q, and New Q with mathematical animation.
- **State Selection Tools**:
  - Jump to Current Agent Position
  - Filter by All, Visited States Only, or Learned States Only
  - Search states by coordinate or label (e.g. `(2, 3)`)
  - Click any row to inspect!
- **Action Comparison Bar Chart**:
  - Visual comparison of `UP`, `DOWN`, `LEFT`, and `RIGHT` values for the selected state.
  - Highest Q-value highlighted with star badge.

### 3. Learning Analytics Dashboard (Page 3)
- **Real-Time KPI Cards**:
  - Training Episode Counter
  - Goal Success Rate (%)
  - Average Steps to Goal
  - Cumulative Collisions
  - Current Exploration Rate ($\epsilon$)
  - Distinct Learned State Count
- **4 Interactive Charts (Recharts)**:
  1. **Reward vs Episode** (cumulative return per episode with area gradient)
  2. **Success Rate vs Episode** (goal reaching convergence curve)
  3. **Epsilon Decay** (exploration schedule decaying to minimum $\epsilon_{min}$)
  4. **State Q-Evolution** (action values over time for start state `(0, 0)`)
- **Interactive Batch Trainer**: Train $+100$, $+500$, $+1000$, $+3000$ episodes on demand.

### 4. Hyperparameters & Settings Modal
- Learning Rate ($\alpha$, default `0.1`)
- Discount Factor ($\gamma$, default `0.95`)
- Initial Exploration Rate ($\epsilon$, default `1.0`)
- Epsilon Decay ($\epsilon_{decay}$, default `0.9995`)
- Minimum Epsilon ($\epsilon_{min}$, default `0.05`)
- **State Representation Mode Selector**:
  - **Coordinate Mode**: `(row, col)` (classic 6×6 tabular grid world, 36 cells)
  - **Local Observation Mode**: 3×3 sensor neighborhood + goal direction vector (Stage 3 compact generalizable representation)

---

## 🛠 Technology Stack

- **Frontend**:
  - React 19 + Vite
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - Framer Motion (agent movement, collision shake, smooth transitions)
  - Recharts (performance curves, action comparison bar chart, epsilon decay)
  - Lucide React (modern AI icons)
- **Backend**:
  - Python 3.13 + FastAPI
  - Uvicorn ASGI server
  - WebSockets & REST APIs
  - Reuses original logic from `Q-learning/environment/grid_env.py` and `Q-learning/agent/local_q_learning.py`

---

## 🚀 How to Run the Website

### Option 1: One-Click Unified Server (Recommended)
Runs FastAPI backend and serves the compiled React application at `http://localhost:8000`:

```bash
python run_app.py
```

Then open your browser at:
👉 **`http://localhost:8000`**

### Option 2: Full Development Mode (Hot Reloading)

1. **Start the FastAPI Backend**:
   ```bash
   python backend/main.py
   ```
   Backend runs at `http://localhost:8000`

2. **Start the Vite Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs at `http://localhost:5173` with proxy configured to backend.

---

## 🔬 Reinforcement Learning Formulation

The agent learns action-value function $Q(s, a)$ via the standard Bellman optimality equation:

$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$

- Valid step: $r = -1.0$
- Obstacle or boundary collision: $r = -5.0$ (agent remains at $s$, $s' = s$)
- Goal cell reached: $r = +100.0$ (terminal state, episode concludes)
- Action selection: $\epsilon$-greedy policy over $\{ \text{UP (0)}, \text{DOWN (1)}, \text{LEFT (2)}, \text{RIGHT (3)} \}$

