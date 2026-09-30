from pathlib import Path
import pickle

from agent.q_learning import QLearningAgent
from environment.grid_env import GridEnvironment
from utils.grid_generator import generate_obstacles


def train(episodes=5000, grid_size=10, obstacle_probability=0.20,
          max_steps=300, model_path="models/q_table.pkl"):
    agent = QLearningAgent()
    successes = 0

    for episode in range(1, episodes + 1):
        goal = (grid_size - 1, grid_size - 1)
        obstacles = generate_obstacles(grid_size, obstacle_probability, goal=goal)
        env = GridEnvironment(grid_size, obstacles, goal=goal)
        state = env.reset()

        for _ in range(max_steps):
            action = agent.choose_action(state)
            result = env.step(action)
            agent.learn(state, action, result.reward, result.state, result.done)
            state = result.state

            if result.done:
                successes += 1
                break

        agent.end_episode()

        if episode % 500 == 0:
            print(f"Episode {episode}/{episodes} | epsilon={agent.epsilon:.3f} | successes={successes}")

    path = Path(model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as file:
        pickle.dump(dict(agent.q_table), file)

    print(f"Model saved to {path}")
    return agent


if __name__ == "__main__":
    train()
