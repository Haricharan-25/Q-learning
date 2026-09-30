# Q-Learning Pathfinding Agent

A reinforcement-learning project where an agent learns to navigate grid environments while avoiding obstacles.

## Stage 2: Dynamic Grid Training

The agent now receives:

- Current position
- Goal position
- Complete obstacle layout

as its state.

Training uses many randomly generated, solvable grids. The final evaluation uses a separate unseen grid.

## Run

```bash
python main.py
```

## Important

Stage 2 uses a tabular Q-learning approach. Because the full grid is part of the state, the number of possible states grows rapidly with grid size and obstacle combinations. This is useful for demonstrating the concept, but Stage 3 will investigate a more scalable representation for generalization.
