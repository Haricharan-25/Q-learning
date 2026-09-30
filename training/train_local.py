from pathlib import Path
import pickle

from agent.local_q_learning import LocalQLearningAgent
from environment.grid_env import GridEnvironment
from utils.grid_generator import generate_obstacles


def train_local(
    episodes=30000,
    grid_size=10,
    obstacle_probability=0.15,
    max_steps=300,
    model_path="models/local_q_table.pkl",
):
    """Train tabular Q-learning using only local observations."""

    agent = LocalQLearningAgent(
        learning_rate=0.1,
        discount_factor=0.95,
        epsilon=1.0,
        epsilon_decay=0.9997,
        epsilon_min=0.05,
    )

    successes = 0

    for episode in range(1, episodes + 1):
        goal = (grid_size - 1, grid_size - 1)

        for _ in range(100):
            obstacles = generate_obstacles(
                grid_size,
                obstacle_probability,
                goal=goal,
            )
            env = GridEnvironment(
                grid_size,
                obstacles,
                goal=goal,
            )

            if _has_possible_path(env):
                break
        else:
            continue

        env.reset()
        state = env.get_local_state()

        for _ in range(max_steps):
            action = agent.choose_action(state)
            old_position = env.state
            old_distance = _manhattan(old_position, env.goal)

            result = env.step(action)
            new_distance = _manhattan(env.state, env.goal)

            # Small reward shaping helps the local agent learn useful
            # movement toward the goal while keeping the main rewards intact.
            reward = result.reward
            if not result.done and result.reward > -5:
                if new_distance < old_distance:
                    reward += 0.5
                elif new_distance > old_distance:
                    reward -= 0.5

            next_state = env.get_local_state()

            agent.learn(
                state,
                action,
                reward,
                next_state,
                result.done,
            )

            state = next_state

            if result.done:
                successes += 1
                break

        agent.end_episode()

        if episode % 3000 == 0:
            rate = successes / episode * 100
            print(
                f"Episode {episode}/{episodes} | "
                f"epsilon={agent.epsilon:.3f} | "
                f"success rate={rate:.1f}% | "
                f"Q-states={len(agent.q_table)}"
            )

    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("wb") as file:
        pickle.dump(dict(agent.q_table), file)

    print(f"Model saved to {path}")
    return agent


def _manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def _has_possible_path(env):
    """BFS is used only to reject impossible training layouts."""
    queue = [env.start]
    visited = {env.start}

    while queue:
        row, col = queue.pop(0)

        if (row, col) == env.goal:
            return True

        for dr, dc in GridEnvironment.ACTIONS.values():
            nxt = (row + dr, col + dc)

            if (
                0 <= nxt[0] < env.size
                and 0 <= nxt[1] < env.size
                and nxt not in env.obstacles
                and nxt not in visited
            ):
                visited.add(nxt)
                queue.append(nxt)

    return False


if __name__ == "__main__":
    train_local()
