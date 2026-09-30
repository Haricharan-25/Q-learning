import random


def generate_obstacles(size, obstacle_probability=0.20, start=(0, 0),
                       goal=None, seed=None):
    if not 0.0 <= obstacle_probability <= 1.0:
        raise ValueError("obstacle_probability must be between 0 and 1.")

    goal = goal if goal is not None else (size - 1, size - 1)
    rng = random.Random(seed)

    obstacles = []
    for row in range(size):
        for col in range(size):
            position = (row, col)
            if position in (start, goal):
                continue
            if rng.random() < obstacle_probability:
                obstacles.append(position)

    return obstacles
