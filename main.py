from environment.grid_env import GridEnvironment
from training.train import train
from utils.grid_generator import generate_obstacles
from training.train import _has_possible_path


def create_test_environment(size=10, obstacle_probability=0.15):
    goal = (size - 1, size - 1)

    while True:
        obstacles = generate_obstacles(
            size,
            obstacle_probability,
            goal=goal,
        )
        env = GridEnvironment(size, obstacles, goal=goal)

        if _has_possible_path(env):
            return env


def run_demo():
    print("Training Q-learning agent on many different grids...")
    agent = train(episodes=10000)

    print("\nTesting on a NEW unseen grid...")
    env = create_test_environment()

    print("\nNew test grid:")
    print(env.render())

    state = env.reset()
    path = [env.state]
    visited = {env.state}

    for _ in range(300):
        action = agent.choose_action(state, training=False)
        result = env.step(action)
        state = result.state

        if env.state in visited:
            # Prevent an endless loop during evaluation.
            break

        visited.add(env.state)
        path.append(env.state)

        if result.done:
            break

    print("\nAgent path:")
    print(env.render(path))

    if env.state == env.goal:
        print(f"\nGoal reached in {len(path) - 1} moves!")
    else:
        print("\nAgent failed to reach the goal on this unseen grid.")


if __name__ == "__main__":
    run_demo()
