from environment.grid_env import GridEnvironment
from training.train_local import train_local, _has_possible_path
from utils.grid_generator import generate_obstacles

def create_test_environment(size=10, obstacle_probability=0.15):
    goal = (size - 1, size - 1)
    while True:
        obstacles = generate_obstacles(size, obstacle_probability, goal=goal)
        env = GridEnvironment(size, obstacles, goal=goal)
        if _has_possible_path(env): return env

def run_demo():
    print("Stage 3: Local-state tabular Q-learning")
    print("Training on many randomly generated grids...")
    agent = train_local(episodes=30000)
    print("\nTesting on NEW unseen grids...")
    total_tests = 100
    successes = 0
    for test_number in range(1, total_tests + 1):
        env = create_test_environment()
        state = env.reset()
        state = env.get_local_state()
        path = [env.state]
        visited = {env.state}
        for _ in range(300):
            action = agent.choose_action(state, training=False)
            result = env.step(action)
            state = env.get_local_state()
            if env.state in visited: break
            visited.add(env.state)
            path.append(env.state)
            if result.done: break
        if env.state == env.goal: successes += 1
        if test_number == 1:
            print("\nExample unseen grid:")
            print(env.render())
            print("\nAgent path:")
            print(env.render(path))
            print(f"\nExample result: {'solved' if env.state == env.goal else 'not solved'}")
    print(f"\nUnseen-grid success rate: {successes}/{total_tests} = {successes / total_tests * 100:.1f}%")

if __name__ == "__main__": run_demo()
