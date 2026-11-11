from pathlib import Path
import pickle
import random

from agent.q_learning import QLearningAgent
from environment.grid_env import GridEnvironment
from utils.grid_generator import generate_obstacles


def train(
    episodes=10000,
    grid_size=10,
    obstacle_probability=0.15,
    max_steps=300,
    model_path="models/q_table.pkl",
):
    """Train on many randomly generated grid layouts."""
    agent = QLearningAgent(
        learning_rate=0.1,
        discount_factor=0.95,
        epsilon=1.0,
        epsilon_decay=0.9995,
        epsilon_min=0.05,
    )

    successes = 0

    for episode in range(1, episodes + 1):
        goal = (grid_size - 1, grid_size - 1)

        # Retry until this random grid has a path from start to goal.
        for _ in range(100):
            obstacles = generate_obstacles(
                grid_size,
                obstacle_probability,
                goal=goal,
            )
            env = GridEnvironment(grid_size, obstacles, goal=goal)
            if _has_possible_path(env):
                break
        else:
            continue

        state = env.reset()

        for _ in range(max_steps):
            action = agent.choose_action(state)
            result = env.step(action)

            agent.learn(
                state,
                action,
                result.reward,
                result.state,
                result.done,
            )

            state = result.state

            if result.done:
                successes += 1
                break

        agent.end_episode()

        if episode % 1000 == 0:
            rate = successes / episode * 100
            print(
                f"Episode {episode}/{episodes} | "
                f"epsilon={agent.epsilon:.3f} | "
                f"success rate={rate:.1f}%"
            )

    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("wb") as file:
        pickle.dump(dict(agent.q_table), file)

    print(f"Model saved to {path}")
    return agent


def _has_possible_path(env):
    """Simple BFS used only to reject impossible training layouts."""
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
    train()
