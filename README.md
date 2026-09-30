# Q-Learning Pathfinding Agent

A reinforcement-learning project where an agent learns to navigate grid environments while avoiding obstacles.

## Stage 1: Basic Q-Learning

The first version trained a tabular Q-learning agent on one fixed grid and demonstrated reliable learning in a fixed environment.

## Stage 2: Full-Grid State

The second version trained on many random grids. The state contained the current position, goal position, and complete obstacle layout. This showed the scalability problem of tabular Q-learning: different layouts create huge numbers of distinct states.

## Stage 3: Local-State Q-Learning

Stage 3 stays fully tabular and uses no neural network. The agent observes a 3x3 neighborhood around itself and the relative direction of the goal.

Local cell encoding: 0 = free, 1 = obstacle, 2 = outside the grid. The final two state values encode goal row and column direction as -1, 0, or 1.

Training uses many randomly generated solvable grids, then evaluation uses separate unseen grids.

Run: python main.py

## Limitation

A 3x3 local view cannot see the whole map. Complex layouts may therefore still require memory or a larger state representation. This stage is an experiment in generalization with a compact tabular state.
