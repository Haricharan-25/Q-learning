import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import random
import math
from collections import defaultdict

# Add parent and Q-learning repo to path
BASE_DIR = Path(__file__).resolve().parent.parent
Q_LEARNING_DIR = BASE_DIR / "Q-learning"
if str(Q_LEARNING_DIR) not in sys.path:
    sys.path.insert(0, str(Q_LEARNING_DIR))

from environment.grid_env import GridEnvironment, StepResult, _sign
from agent.local_q_learning import LocalQLearningAgent
from agent.q_learning import QLearningAgent
from utils.grid_generator import generate_obstacles


ACTION_NAMES = {
    0: "UP",
    1: "DOWN",
    2: "LEFT",
    3: "RIGHT",
}

ACTION_DELTAS = {
    0: (-1, 0),
    1: (1, 0),
    2: (0, -1),
    3: (0, 1),
}

ACTION_ARROWS = {
    0: "↑",
    1: "↓",
    2: "←",
    3: "→",
}


def check_path_exists(size: int, obstacles: set, start: Tuple[int, int], goal: Tuple[int, int]) -> Tuple[bool, int]:
    """Check if a path exists from start to goal using BFS. Returns (reachable, min_steps)."""
    if start == goal:
        return True, 0
    if start in obstacles or goal in obstacles:
        return False, -1

    queue = [(start[0], start[1], 0)]
    visited = {start}

    while queue:
        r, c, dist = queue.pop(0)
        if (r, c) == goal:
            return True, dist

        for dr, dc in ACTION_DELTAS.values():
            nr, nc = r + dr, c + dc
            if 0 <= nr < size and 0 <= nc < size and (nr, nc) not in obstacles and (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append((nr, nc, dist + 1))

    return False, -1


class LoopDetector:
    """Tracks position and action history to detect repetitive movement loops and oscillations."""

    def __init__(self, start_pos: Optional[Tuple[int, int]] = None):
        self.reset(start_pos)

    def reset(self, start_pos: Optional[Tuple[int, int]] = None):
        self.positions: List[Tuple[int, int]] = [start_pos] if start_pos else []
        self.actions: List[int] = []
        self.collisions: List[bool] = []
        self.cell_visit_counts: Dict[Tuple[int, int], int] = defaultdict(int)
        if start_pos:
            self.cell_visit_counts[start_pos] = 1

    def record_step(self, pos: Tuple[int, int], action: int, is_collision: bool):
        self.positions.append(pos)
        self.actions.append(action)
        self.collisions.append(is_collision)
        self.cell_visit_counts[pos] += 1

    def detect_loop(self) -> Optional[Dict[str, Any]]:
        n = len(self.positions)
        if n < 2:
            return None

        # 1. Repeated Collision Pattern (Agent at P repeatedly attempts action A and collides)
        if len(self.collisions) >= 2 and self.collisions[-1] and self.collisions[-2]:
            if self.positions[-1] == self.positions[-2] and self.actions[-1] == self.actions[-2]:
                collided_action = self.actions[-1]
                collided_pos = self.positions[-1]
                return {
                    "is_loop": True,
                    "loop_type": "REPEATED_COLLISION",
                    "title": "Repeated Obstacle / Boundary Collision",
                    "loop_cells": [list(collided_pos)],
                    "loop_actions": [ACTION_NAMES[self.actions[-2]], ACTION_NAMES[self.actions[-1]]],
                    "action_responsible": collided_action,
                    "action_responsible_name": ACTION_NAMES[collided_action],
                    "cycle_length": 1,
                    "description": f"Agent repeatedly attempted action {ACTION_NAMES[collided_action]} into an obstacle/boundary from {collided_pos}.",
                    "explanation": (
                        f"The agent at {collided_pos} repeatedly attempted to move {ACTION_NAMES[collided_action]}, "
                        f"resulting in consecutive collisions. The greedy policy picked the same blocked action "
                        f"because its Q-value had not fallen below alternatives or alternatives were equally penalized."
                    ),
                }

        # 2. 2-Step Oscillation: A -> B -> A -> B
        if n >= 4:
            p = self.positions
            if p[-1] == p[-3] and p[-2] == p[-4] and p[-1] != p[-2]:
                cell_a, cell_b = p[-2], p[-1]
                act_seq = [ACTION_NAMES[a] for a in self.actions[-4:]]
                resp_action = self.actions[-2]
                return {
                    "is_loop": True,
                    "loop_type": "OSCILLATION_2",
                    "title": "2-Cell Repetitive Oscillation (A ⇄ B)",
                    "loop_cells": [list(cell_a), list(cell_b)],
                    "loop_actions": act_seq,
                    "action_responsible": resp_action,
                    "action_responsible_name": ACTION_NAMES[resp_action],
                    "cycle_length": 2,
                    "description": f"Agent is oscillating back-and-forth between cells {cell_a} and {cell_b}.",
                    "explanation": (
                        f"The agent is trapped in a 2-step loop between {cell_a} and {cell_b} via actions {act_seq[-2]} and {act_seq[-1]}. "
                        f"At {cell_a}, action {act_seq[-2]} had the highest Q-value; at {cell_b}, action {act_seq[-1]} had the highest Q-value. "
                        f"Alternative forward paths were likely blocked by obstacles or had lower Q-values (-5.0 collision penalty vs -1.0 step cost)."
                    ),
                }

        # 3. 3-Step Cycle: A -> B -> C -> A -> B -> C
        if n >= 6:
            p = self.positions
            if p[-6:-3] == p[-3:] and len(set(p[-3:])) == 3:
                cycle_cells = p[-3:]
                act_seq = [ACTION_NAMES[a] for a in self.actions[-6:]]
                resp_action = self.actions[-3]
                return {
                    "is_loop": True,
                    "loop_type": "CYCLE_3",
                    "title": "3-Cell Cyclic Loop (A → B → C → A)",
                    "loop_cells": [list(c) for c in cycle_cells],
                    "loop_actions": act_seq,
                    "action_responsible": resp_action,
                    "action_responsible_name": ACTION_NAMES[resp_action],
                    "cycle_length": 3,
                    "description": f"Agent completed a 3-cell triangular cycle: {' → '.join(str(c) for c in cycle_cells)}.",
                    "explanation": (
                        f"The agent followed a 3-step cycle {' → '.join(str(c) for c in cycle_cells)} twice consecutively. "
                        f"Each step chose the greedy action leading to the next cell in the loop because genuine goal-directed paths were unexplored or blocked."
                    ),
                }

        # 4. Generalized k-Step Cycle (k = 4, 5)
        for k in (4, 5):
            if n >= 2 * k:
                p = self.positions
                if p[-2 * k : -k] == p[-k:] and len(set(p[-k:])) == k:
                    cycle_cells = p[-k:]
                    act_seq = [ACTION_NAMES[a] for a in self.actions[-2 * k :]]
                    resp_action = self.actions[-k]
                    return {
                        "is_loop": True,
                        "loop_type": "CYCLE_K",
                        "title": f"{k}-Cell Repetitive Circuit",
                        "loop_cells": [list(c) for c in cycle_cells],
                        "loop_actions": act_seq,
                        "action_responsible": resp_action,
                        "action_responsible_name": ACTION_NAMES[resp_action],
                        "cycle_length": k,
                        "description": f"Agent completed a {k}-cell closed circuit: {' → '.join(str(c) for c in cycle_cells)}.",
                        "explanation": (
                            f"The agent repeated a {k}-step circuit. Action values in this sub-graph form a closed loop where each state's "
                            f"greedy choice leads to the next state in the cycle rather than progressing toward the goal."
                        ),
                    }

        # 5. Local Churning (visiting only 2-3 distinct cells in the last 8 steps)
        if n >= 8:
            recent_cells = set(self.positions[-8:])
            if len(recent_cells) <= 2:
                cells_list = list(recent_cells)
                return {
                    "is_loop": True,
                    "loop_type": "CHURNING",
                    "title": "Localized Pocket Churning",
                    "loop_cells": [list(c) for c in cells_list],
                    "loop_actions": [ACTION_NAMES[a] for a in self.actions[-4:]],
                    "action_responsible": self.actions[-1],
                    "action_responsible_name": ACTION_NAMES[self.actions[-1]],
                    "cycle_length": len(cells_list),
                    "description": f"Agent is churned inside a confined set of cells: {cells_list}.",
                    "explanation": (
                        f"The agent spent the last 8 steps confined to cells {cells_list} without making progress. "
                        f"The current policy lacks sufficient exploration to break out of this local trap."
                    ),
                }

        return None


class SimulationEngine:
    """Core engine that ties GridEnvironment, Q-Learning Agents, Loop Detection & Visualizer state together."""

    def __init__(
        self,
        grid_size: int = 6,
        start: Tuple[int, int] = (0, 0),
        goal: Tuple[int, int] = (5, 5),
        obstacles: Optional[List[Tuple[int, int]]] = None,
        learning_rate: float = 0.1,
        discount_factor: float = 0.95,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.9995,
        epsilon_min: float = 0.05,
        state_mode: str = "coordinate",  # "coordinate" or "local"
    ):
        self.grid_size = grid_size
        self.start = tuple(start)
        self.goal = tuple(goal)
        self.obstacles = set(tuple(p) for p in (obstacles or []))
        
        # Hyperparameters
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.state_mode = state_mode  # "coordinate" (row, col) or "local" (3x3 + dir)

        # Loop detection & intelligent recovery controls
        self.loop_detector = LoopDetector(self.start)
        self.loop_detection_enabled = True
        self.recovery_enabled = True
        self.max_episode_steps = 100
        self.visitation_bonus_enabled = True
        self.visitation_bonus_weight = 0.25
        self.loop_penalty_enabled = True
        self.loop_penalty_amount = -1.5

        # State-action visitation tracking: N(s, a)
        self.state_action_visits: Dict[Any, List[int]] = defaultdict(lambda: [0, 0, 0, 0])

        # Active loop state in current simulation
        self.active_loop_info: Optional[Dict[str, Any]] = None
        self.consecutive_recovery_count = 0

        # Environment & Agent initialization
        self._init_environment_and_agent()

        # Training history & metrics
        self.training_episodes = 0
        self.history_episodes: List[Dict[str, Any]] = []
        self.key_states_history: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        
        # Current active simulation playback state
        self.sim_step_count = 0
        self.sim_path: List[Tuple[int, int]] = [self.start]
        self.sim_visited: List[Tuple[int, int]] = [self.start]
        self.sim_done = False
        self.sim_history: List[Dict[str, Any]] = []  # Detailed step replay history

    def _init_environment_and_agent(self):
        # Create environment
        self.env = GridEnvironment(
            size=self.grid_size,
            obstacles=list(self.obstacles),
            start=self.start,
            goal=self.goal,
        )

        if self.state_mode == "local":
            self.agent = LocalQLearningAgent(
                learning_rate=self.learning_rate,
                discount_factor=self.discount_factor,
                epsilon=self.epsilon,
                epsilon_decay=self.epsilon_decay,
                epsilon_min=self.epsilon_min,
                actions=4,
            )
        else:
            self.agent = QLearningAgent(
                learning_rate=self.learning_rate,
                discount_factor=self.discount_factor,
                epsilon=self.epsilon,
                epsilon_decay=self.epsilon_decay,
                epsilon_min=self.epsilon_min,
                actions=4,
            )

    def set_grid(
        self,
        grid_size: Optional[int] = None,
        start: Optional[Tuple[int, int]] = None,
        goal: Optional[Tuple[int, int]] = None,
        obstacles: Optional[List[Tuple[int, int]]] = None,
        keep_q_table: bool = False,
    ):
        if grid_size is not None:
            self.grid_size = grid_size
        if start is not None:
            self.start = tuple(start)
        if goal is not None:
            self.goal = tuple(goal)
        if obstacles is not None:
            self.obstacles = set(tuple(p) for p in obstacles)
            # Ensure start and goal are never obstacles
            self.obstacles.discard(self.start)
            self.obstacles.discard(self.goal)

        old_q_table = dict(self.agent.q_table) if (keep_q_table and hasattr(self, "agent")) else None
        old_epsilon = self.agent.epsilon if hasattr(self, "agent") else self.epsilon

        self._init_environment_and_agent()

        if keep_q_table and old_q_table:
            for k, v in old_q_table.items():
                self.agent.q_table[k] = list(v)
            self.agent.epsilon = old_epsilon

        self.reset_simulation()

    def reset_agent(self):
        """Reset Q-table, visitation counts, epsilon, and training metrics."""
        self.agent.q_table.clear()
        self.state_action_visits.clear()
        self.agent.epsilon = self.epsilon
        self.training_episodes = 0
        self.history_episodes.clear()
        self.key_states_history.clear()
        self.reset_simulation()

    def reset_simulation(self):
        """Reset live simulation back to the start cell."""
        self.env.reset()
        self.sim_step_count = 0
        self.sim_path = [self.start]
        self.sim_visited = [self.start]
        self.sim_done = False
        self.sim_history.clear()
        self.loop_detector.reset(self.start)
        self.active_loop_info = None
        self.consecutive_recovery_count = 0

    def get_state_key(self, env: Optional[GridEnvironment] = None) -> Any:
        target_env = env or self.env
        if self.state_mode == "local":
            return target_env.get_local_state()
        else:
            return target_env.state

    def format_state_name(self, state_key: Any) -> str:
        """User-friendly representation of a state key."""
        if self.state_mode == "local":
            if isinstance(state_key, (list, tuple)) and len(state_key) == 11:
                dr, dc = state_key[9], state_key[10]
                dir_arrow = "•"
                if dr == -1 and dc == 0: dir_arrow = "↑ North"
                elif dr == 1 and dc == 0: dir_arrow = "↓ South"
                elif dr == 0 and dc == -1: dir_arrow = "← West"
                elif dr == 0 and dc == 1: dir_arrow = "→ East"
                elif dr == -1 and dc == -1: dir_arrow = "↖ NW"
                elif dr == -1 and dc == 1: dir_arrow = "↗ NE"
                elif dr == 1 and dc == -1: dir_arrow = "↙ SW"
                elif dr == 1 and dc == 1: dir_arrow = "↘ SE"
                
                def c_sym(val):
                    return "." if val == 0 else ("#" if val == 1 else "X")
                
                neighbors = f"N:{c_sym(state_key[1])} S:{c_sym(state_key[7])} W:{c_sym(state_key[3])} E:{c_sym(state_key[5])}"
                return f"Local [{neighbors} | Goal: {dir_arrow}]"
            return str(state_key)
        else:
            if isinstance(state_key, (list, tuple)) and len(state_key) == 2:
                return f"Cell ({state_key[0]}, {state_key[1]})"
            return str(state_key)

    def select_recovery_action(
        self,
        state_key: Any,
        current_coord: Tuple[int, int],
        loop_info: Dict[str, Any],
        temperature: float = 0.5,
    ) -> Tuple[int, str]:
        """
        Controlled recovery exploration strategy:
        Selects an alternative action from state_key that avoids repeating the loop,
        ranking candidates by validity and learned Q-values with Softmax temperature.
        The agent continues to use its learned Q-values rather than arbitrary teleportation.
        """
        values = self.agent.q_table[state_key]
        blocked_action = loop_info.get("action_responsible")
        
        # Candidate actions: exclude the action responsible for continuing the loop
        candidates = [a for a in range(self.agent.actions) if a != blocked_action]
        if not candidates:
            candidates = list(range(self.agent.actions))

        # Check validity of each candidate action from current position
        valid_candidates = []
        for a in candidates:
            dr, dc = ACTION_DELTAS[a]
            nr, nc = current_coord[0] + dr, current_coord[1] + dc
            is_valid = (0 <= nr < self.grid_size and 0 <= nc < self.grid_size and (nr, nc) not in self.obstacles)
            valid_candidates.append((a, values[a], is_valid))

        # If any valid (non-colliding) candidate exists, prefer those
        has_valid = any(item[2] for item in valid_candidates)
        pool = [item for item in valid_candidates if item[2]] if has_valid else valid_candidates

        # Sort candidate pool by Q-value descending
        pool.sort(key=lambda x: x[1], reverse=True)

        # Softmax sampling over candidate Q-values to balance exploitation with exploration
        max_c_q = pool[0][1]
        exp_weights = []
        for a, q, _ in pool:
            scaled = (q - max_c_q) / max(1e-4, temperature)
            exp_weights.append(math.exp(max(-20.0, min(20.0, scaled))))

        total_weight = sum(exp_weights)
        if total_weight > 0:
            probs = [w / total_weight for w in exp_weights]
            chosen_action = random.choices([a for a, _, _ in pool], weights=probs, k=1)[0]
        else:
            chosen_action = pool[0][0]

        reason = (
            f"Recovery Action: Loop detected ({loop_info['title']}). "
            f"Suppressed repeating action {ACTION_NAMES.get(blocked_action, '?')}. "
            f"Evaluated alternative candidates {[f'{ACTION_NAMES[a]}: {q:.2f}' for a, q, _ in pool]}. "
            f"Selected {ACTION_NAMES[chosen_action]} via controlled Q-value recovery."
        )
        return chosen_action, reason

    def train_batch(self, episodes: int = 500, max_steps: Optional[int] = None) -> Dict[str, Any]:
        """Train the agent for a number of episodes on the current grid environment."""
        steps_limit = max_steps or self.max_episode_steps
        start_ep = self.training_episodes + 1
        end_ep = self.training_episodes + episodes

        batch_rewards = []
        batch_steps = []
        batch_successes = 0
        batch_collisions = 0
        batch_loops_detected = 0

        for ep in range(start_ep, end_ep + 1):
            self.env.reset()
            state = self.get_state_key()
            ep_reward = 0.0
            ep_collisions = 0
            ep_success = False

            # Local episode detector for training loop penalties
            ep_cell_visits = defaultdict(int)
            ep_cell_visits[self.env.state] += 1
            ep_positions = [self.env.state]

            for step in range(steps_limit):
                # Epsilon-greedy action selection with random tie-breaking
                if random.random() < self.agent.epsilon:
                    action = random.randrange(self.agent.actions)
                else:
                    values = self.agent.q_table[state]
                    maximum = max(values)
                    # Random tie-breaking between equally valued actions
                    best_actions = [i for i, val in enumerate(values) if abs(val - maximum) < 1e-7]
                    action = random.choice(best_actions)

                # Check collision
                dr, dc = ACTION_DELTAS[action]
                nr, nc = self.env.state[0] + dr, self.env.state[1] + dc
                is_collision = not self.env._valid_position((nr, nc))
                if is_collision:
                    ep_collisions += 1

                # Step environment
                result = self.env.step(action)
                next_state = self.get_state_key()
                next_coord = self.env.state
                
                # Update visitation tracking
                self.state_action_visits[state][action] += 1
                ep_cell_visits[next_coord] += 1
                ep_positions.append(next_coord)

                # Calculate shaped reward for learning
                reward = result.reward

                # 1. Visitation-based exploration bonus (intrinsic curiosity)
                if self.visitation_bonus_enabled and not result.done:
                    visit_count = self.state_action_visits[state][action]
                    bonus = self.visitation_bonus_weight / math.sqrt(visit_count)
                    reward += bonus

                # 2. Loop / Re-visitation penalty
                if self.loop_penalty_enabled and not result.done:
                    # Penalize re-visiting the same cell repeatedly in the same episode
                    if ep_cell_visits[next_coord] > 1:
                        reward += self.loop_penalty_amount * min(3, ep_cell_visits[next_coord] - 1)
                    
                    # Detect 2-step oscillation in training: A -> B -> A
                    if len(ep_positions) >= 4 and ep_positions[-1] == ep_positions[-3] and ep_positions[-2] == ep_positions[-4]:
                        reward += self.loop_penalty_amount
                        batch_loops_detected += 1

                # Learn via standard Bellman update
                self.agent.learn(
                    state,
                    action,
                    reward,
                    next_state,
                    result.done,
                )

                state = next_state
                ep_reward += result.reward

                if result.done:
                    ep_success = True
                    break

            # Decay epsilon
            self.agent.end_episode()
            # Ensure epsilon does not decay below epsilon_min
            self.agent.epsilon = max(self.epsilon_min, self.agent.epsilon)

            batch_rewards.append(ep_reward)
            batch_steps.append(step + 1)
            if ep_success:
                batch_successes += 1
            batch_collisions += ep_collisions

            # Record periodic history metrics
            if ep == 1 or ep % 5 == 0 or ep == end_ep:
                cum_successes = sum(1 for h in self.history_episodes if h["success"]) + (1 if ep_success else 0)
                cum_rate = (cum_successes / ep) * 100.0

                point = {
                    "episode": ep,
                    "reward": round(ep_reward, 2),
                    "steps": step + 1,
                    "success": ep_success,
                    "success_rate": round(cum_rate, 1),
                    "collisions": ep_collisions,
                    "epsilon": round(self.agent.epsilon, 4),
                    "q_states_count": len(self.agent.q_table),
                }
                self.history_episodes.append(point)

                # Record start state Q-values
                start_state = self.get_state_for_coord(self.start)
                if start_state in self.agent.q_table:
                    vals = [round(v, 3) for v in self.agent.q_table[start_state]]
                    self.key_states_history["start"].append({
                        "episode": ep,
                        "values": vals,
                        "max_q": max(vals),
                    })

        self.training_episodes = end_ep
        self.reset_simulation()

        return {
            "trained_episodes": episodes,
            "total_episodes": self.training_episodes,
            "success_rate": round((batch_successes / max(1, episodes)) * 100.0, 1),
            "avg_reward": round(sum(batch_rewards) / max(1, episodes), 2),
            "avg_steps": round(sum(batch_steps) / max(1, episodes), 1),
            "total_collisions": batch_collisions,
            "epsilon": round(self.agent.epsilon, 4),
            "q_states_count": len(self.agent.q_table),
            "loops_penalized": batch_loops_detected,
        }

    def get_state_for_coord(self, coord: Tuple[int, int]) -> Any:
        if self.state_mode == "coordinate":
            return coord
        else:
            old_state = self.env.state
            self.env.state = coord
            local_st = self.env.get_local_state()
            self.env.state = old_state
            return local_st

    def step_simulation(
        self,
        mode: str = "exploit",
        forced_action: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Execute a single simulation step with loop detection and intelligent recovery.
        mode: 'exploit' (greedy policy), 'explore' (epsilon-greedy), 'train_step' (live learning)
        """
        if self.sim_done:
            return {"done": True, "message": "Simulation already reached terminal state."}

        current_coord = self.env.state
        state_key = self.get_state_key()

        # Pre-step Q-values & visit counts
        q_vals_before = [round(float(v), 4) for v in self.agent.q_table[state_key]]
        action_visit_counts = list(self.state_action_visits[state_key])

        # Step 1: Detect if the agent is currently in a repetitive loop
        detected_loop = None
        if self.loop_detection_enabled:
            detected_loop = self.loop_detector.detect_loop()
            self.active_loop_info = detected_loop

        # Step 2: Action Selection (Manual override, Recovery Mode, Exploration, or Exploitation)
        is_training = (mode in ("explore", "train_step"))
        rand_val = random.random()
        is_exploration = is_training and (rand_val < self.agent.epsilon)
        is_recovery_step = False
        recovery_reason = ""

        if forced_action is not None and forced_action in ACTION_NAMES:
            action = forced_action
            decision_reason = f"Manual override: User selected {ACTION_NAMES[action]}."
        elif self.recovery_enabled and detected_loop:
            # Activate intelligent recovery
            is_recovery_step = True
            self.consecutive_recovery_count += 1
            # Increase exploration temperature as consecutive recovery attempts rise
            temp = min(1.5, 0.4 + self.consecutive_recovery_count * 0.2)
            action, recovery_reason = self.select_recovery_action(state_key, current_coord, detected_loop, temperature=temp)
            decision_reason = recovery_reason
        elif is_exploration:
            action = random.randrange(self.agent.actions)
            decision_reason = (
                f"Exploration step: Epsilon-greedy condition triggered "
                f"(rand {rand_val:.3f} < ε {self.agent.epsilon:.3f}). "
                f"Randomly selected {ACTION_NAMES[action]}."
            )
            self.consecutive_recovery_count = 0
        else:
            # Exploitation: argmax with randomized tie-breaking
            values = self.agent.q_table[state_key]
            maximum = max(values)
            best_actions = [i for i, val in enumerate(values) if abs(val - maximum) < 1e-7]
            action = random.choice(best_actions)
            if maximum == 0.0 and all(v == 0.0 for v in values):
                decision_reason = (
                    f"Exploitation (unvisited): All Q-values are 0.0. "
                    f"Randomly broke tie by selecting {ACTION_NAMES[action]}."
                )
            else:
                decision_reason = (
                    f"Exploitation: Selected {ACTION_NAMES[action]} because its Q-value ({maximum:.3f}) "
                    f"is the maximum among available actions."
                )
            self.consecutive_recovery_count = 0

        # Step 3: Check target cell & collision
        dr, dc = ACTION_DELTAS[action]
        target_coord = (current_coord[0] + dr, current_coord[1] + dc)
        is_out_of_bounds = not (0 <= target_coord[0] < self.grid_size and 0 <= target_coord[1] < self.grid_size)
        is_obstacle_hit = (target_coord in self.obstacles)
        is_collision = is_out_of_bounds or is_obstacle_hit

        collision_type = None
        if is_obstacle_hit:
            collision_type = "OBSTACLE"
        elif is_out_of_bounds:
            collision_type = "BOUNDARY"

        # Step 4: Execute step in environment
        result = self.env.step(action)
        next_coord = self.env.state
        next_state_key = self.get_state_key()

        # Update visitation tracking
        self.state_action_visits[state_key][action] += 1
        self.loop_detector.record_step(next_coord, action, is_collision)

        # Step 5: Bellman Q-value update (if in live learning mode or training step)
        q_old = self.agent.q_table[state_key][action]
        next_max = 0.0 if result.done else max(self.agent.q_table[next_state_key])
        
        # Include loop penalty during live learn if applicable
        reward_used = result.reward
        if self.loop_penalty_enabled and detected_loop and mode == "train_step":
            reward_used += self.loop_penalty_amount

        td_target = reward_used + self.agent.gamma * next_max
        td_error = td_target - q_old
        new_q = q_old + self.agent.alpha * td_error

        if mode == "train_step":
            self.agent.learn(state_key, action, reward_used, next_state_key, result.done)

        # Post-step Q-values & updated visitation
        q_vals_after = [round(float(v), 4) for v in self.agent.q_table[state_key]]
        updated_visit_counts = list(self.state_action_visits[state_key])

        # Step 6: Formulate human-readable thinking and collision explanations
        thinking_text = self._generate_thinking_text(
            current_coord,
            action,
            target_coord,
            is_collision,
            collision_type,
            result.reward,
            q_old,
            new_q,
            decision_reason,
            detected_loop,
            is_recovery_step,
        )

        collision_explanation = ""
        if is_collision:
            collision_explanation = (
                f"Agent at {current_coord} attempted to move {ACTION_NAMES[action]} into "
                f"{'an obstacle' if collision_type == 'OBSTACLE' else 'grid boundary'} at {target_coord}. "
                f"Collision occurred! The agent remains at {current_coord}. "
                f"Penalty reward: {result.reward}. "
                f"The Q-value for {ACTION_NAMES[action]} updated from {q_old:.3f} to {new_q:.3f}. "
                f"This penalty reduces the likelihood of choosing {ACTION_NAMES[action]} from this state in future visits."
            )

        # Update simulation tracking
        self.sim_step_count += 1
        if next_coord not in self.sim_visited:
            self.sim_visited.append(next_coord)
        self.sim_path.append(next_coord)
        
        # Terminal check: reached goal or reached max episode steps
        self.sim_done = result.done or (self.sim_step_count >= self.max_episode_steps)

        step_data = {
            "step_index": self.sim_step_count,
            "current_position": current_coord,
            "target_position": target_coord,
            "next_position": next_coord,
            "action": action,
            "action_name": ACTION_NAMES[action],
            "action_arrow": ACTION_ARROWS[action],
            "reward": result.reward,
            "done": result.done,
            "reached_goal": (next_coord == self.goal),
            "is_collision": is_collision,
            "collision_type": collision_type,
            "collision_position": target_coord if is_collision else None,
            "state_key": str(state_key),
            "state_name": self.format_state_name(state_key),
            "next_state_key": str(next_state_key),
            "next_state_name": self.format_state_name(next_state_key),
            "q_values_before": q_vals_before,
            "q_values_after": q_vals_after,
            "action_visit_counts": updated_visit_counts,
            "old_q": round(q_old, 4),
            "new_q": round(new_q, 4),
            "td_target": round(td_target, 4),
            "td_error": round(td_error, 4),
            "next_max_q": round(next_max, 4),
            "alpha": self.agent.alpha,
            "gamma": self.agent.gamma,
            "is_exploration": is_exploration,
            "decision_reason": decision_reason,
            "thinking_text": thinking_text,
            "collision_explanation": collision_explanation,
            "path": list(self.sim_path),
            "visited": list(self.sim_visited),
            # Loop detection & recovery telemetry
            "loop_detected": detected_loop is not None,
            "loop_info": detected_loop,
            "is_recovery": is_recovery_step,
            "recovery_reason": recovery_reason,
            "recovery_action": ACTION_NAMES[action] if is_recovery_step else None,
        }

        self.sim_history.append(step_data)
        return step_data

    def _generate_thinking_text(
        self,
        current: Tuple[int, int],
        action: int,
        target: Tuple[int, int],
        is_collision: bool,
        collision_type: Optional[str],
        reward: float,
        q_old: float,
        new_q: float,
        decision_reason: str,
        detected_loop: Optional[Dict[str, Any]],
        is_recovery_step: bool,
    ) -> List[str]:
        lines = [
            f"1. Position: I am currently at cell {current}.",
            f"2. Observation: Target cell {target} is {'an OBSTACLE' if collision_type == 'OBSTACLE' else ('OUT OF BOUNDS' if collision_type == 'BOUNDARY' else 'FREE space')}.",
        ]

        if is_recovery_step and detected_loop:
            lines.append(f"3. Loop Alert: {detected_loop['title']} active! Suppressed repeating action {detected_loop.get('action_responsible_name', '?')}.")
            lines.append(f"4. Decision (Recovery): {decision_reason}")
        else:
            lines.append(f"3. Decision: {decision_reason}")

        if is_collision:
            lines.append(f"5. Outcome: Collision occurred! Remained at {current}. Received penalty reward of {reward}.")
            lines.append(f"6. Q-Update: Q(s, {ACTION_NAMES[action]}) updated from {q_old:.3f} to {new_q:.3f}. Noticeable drop.")
        elif reward >= 100.0:
            lines.append(f"5. Outcome: Reached the GOAL at {target}! Received terminal reward of +100.0.")
            lines.append(f"6. Q-Update: Q(s, {ACTION_NAMES[action]}) rewarded significantly!")
        else:
            lines.append(f"5. Outcome: Successfully moved {ACTION_NAMES[action]} to {target}. Received transition reward of {reward}.")
            lines.append(f"6. Q-Update: Q(s, {ACTION_NAMES[action]}) updated from {q_old:.3f} to {new_q:.3f} based on Bellman optimality.")

        return lines

    def get_full_q_table(self) -> List[Dict[str, Any]]:
        """Return the Q-table with states formatted for table view including visit counts and loop tags."""
        table = []
        loop_cells = set(tuple(c) for c in (self.active_loop_info.get("loop_cells", []) if self.active_loop_info else []))
        
        if self.state_mode == "coordinate":
            for r in range(self.grid_size):
                for c in range(self.grid_size):
                    coord = (r, c)
                    vals = [round(float(v), 3) for v in self.agent.q_table[coord]]
                    visits = list(self.state_action_visits[coord])
                    max_val = max(vals)
                    best_action = ACTION_NAMES[vals.index(max_val)] if any(v != 0 for v in vals) else "NONE"
                    
                    cell_type = "empty"
                    if coord == self.start: cell_type = "start"
                    elif coord == self.goal: cell_type = "goal"
                    elif coord in self.obstacles: cell_type = "obstacle"

                    is_in_loop = coord in loop_cells
                    loop_action = self.active_loop_info.get("action_responsible_name") if is_in_loop and self.active_loop_info else None

                    table.append({
                        "id": f"state_coord_{r}_{c}",
                        "coord": [r, c],
                        "state_key": str(coord),
                        "state_name": f"Cell ({r}, {c})",
                        "cell_type": cell_type,
                        "up": vals[0],
                        "down": vals[1],
                        "left": vals[2],
                        "right": vals[3],
                        "up_visits": visits[0],
                        "down_visits": visits[1],
                        "left_visits": visits[2],
                        "right_visits": visits[3],
                        "total_visits": sum(visits),
                        "max_q": max_val,
                        "best_action": best_action,
                        "visited": coord in self.sim_visited,
                        "is_agent": self.env.state == coord,
                        "is_in_loop": is_in_loop,
                        "loop_trigger_action": loop_action,
                    })
        else:
            for idx, (st_key, vals) in enumerate(self.agent.q_table.items()):
                rounded_vals = [round(float(v), 3) for v in vals]
                visits = list(self.state_action_visits[st_key])
                max_val = max(rounded_vals)
                best_action = ACTION_NAMES[rounded_vals.index(max_val)] if any(v != 0 for v in rounded_vals) else "NONE"
                
                table.append({
                    "id": f"state_local_{idx}",
                    "coord": None,
                    "state_key": str(st_key),
                    "state_name": self.format_state_name(st_key),
                    "cell_type": "local_state",
                    "up": rounded_vals[0],
                    "down": rounded_vals[1],
                    "left": rounded_vals[2],
                    "right": rounded_vals[3],
                    "up_visits": visits[0],
                    "down_visits": visits[1],
                    "left_visits": visits[2],
                    "right_visits": visits[3],
                    "total_visits": sum(visits),
                    "max_q": max_val,
                    "best_action": best_action,
                    "visited": False,
                    "is_agent": (st_key == self.get_state_key()),
                    "is_in_loop": False,
                    "loop_trigger_action": None,
                })

        return table

    def get_summary(self) -> Dict[str, Any]:
        reachable, min_dist = check_path_exists(self.grid_size, self.obstacles, self.start, self.goal)
        current_state_key = self.get_state_key()
        curr_vals = [round(float(v), 3) for v in self.agent.q_table[current_state_key]]
        curr_visits = list(self.state_action_visits[current_state_key])

        return {
            "grid_size": self.grid_size,
            "start": list(self.start),
            "goal": list(self.goal),
            "obstacles": [list(o) for o in sorted(self.obstacles)],
            "agent_position": list(self.env.state),
            "state_mode": self.state_mode,
            "path_reachable": reachable,
            "shortest_path_steps": min_dist,
            "training_episodes": self.training_episodes,
            "epsilon": round(self.agent.epsilon, 4),
            "alpha": self.agent.alpha,
            "gamma": self.agent.gamma,
            "q_states_count": len(self.agent.q_table),
            "sim_step_count": self.sim_step_count,
            "sim_done": self.sim_done,
            "sim_path": [list(p) for p in self.sim_path],
            "sim_visited": [list(p) for p in self.sim_visited],
            "current_state_name": self.format_state_name(current_state_key),
            "current_q_values": curr_vals,
            "current_visit_counts": curr_visits,
            # Loop detection & recovery controls
            "loop_detection_enabled": self.loop_detection_enabled,
            "recovery_enabled": self.recovery_enabled,
            "max_episode_steps": self.max_episode_steps,
            "visitation_bonus_enabled": self.visitation_bonus_enabled,
            "loop_penalty_enabled": self.loop_penalty_enabled,
            "active_loop_info": self.active_loop_info,
        }
