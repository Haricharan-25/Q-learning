from environment.grid_env import GridEnvironment
from training.train import train
from utils.grid_generator import generate_obstacles


def run_demo():
    print("Training Q-learning agent...")
    agent = train(episodes=5000)

    size = 10
    goal = (size - 1, size - 1)
    obstacles = generate_obstacles(size, 0.20, goal=goal)
    env = GridEnvironment(size, obstacles, goal=goal)

    state = env.reset()
    path = [state]

    for _ in range(300):
        action = agent.choose_action(state, training=False)
        result = env.step(action)
        state = result.state
        path.append(state)

        if result.done:
            break

    print("\nNew grid:")
    print(env.render())
    print("\nAgent path:")
    print(env.render(path))
    print("\nGoal reached!" if state == goal else "\nGoal not reached within step limit.")


if __name__ == "__main__":
    run_demo()
