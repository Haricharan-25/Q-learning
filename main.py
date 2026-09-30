from training.train import train


def run_demo():
    print("Training Q-learning agent...")
    agent, env = train(episodes=5000)

    state = env.reset()
    path = [state]

    for _ in range(300):
        action = agent.choose_action(state, training=False)
        result = env.step(action)
        state = result.state
        path.append(state)

        if result.done:
            break

    print("\nLearned path:")
    print(env.render(path))

    if state == env.goal:
        print(f"\nGoal reached in {len(path) - 1} moves!")
    else:
        print("\nGoal not reached within the step limit.")


if __name__ == "__main__":
    run_demo()
