from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

Position = Tuple[int, int]


@dataclass
class StepResult:
    state: Position
    reward: float
    done: bool


class GridEnvironment:
    ACTIONS: Dict[int, Position] = {
        0: (-1, 0), 1: (1, 0), 2: (0, -1), 3: (0, 1)
    }

    def __init__(self, size=10, obstacles=None, start=(0, 0), goal=None):
        self.size = size
        self.start = start
        self.goal = goal if goal is not None else (size - 1, size - 1)
        self.obstacles = set(obstacles or [])
        self.state = self.start

        if not self._valid_position(self.start) or not self._valid_position(self.goal):
            raise ValueError("Start and goal must be valid free cells.")

    def _valid_position(self, position):
        row, col = position
        return 0 <= row < self.size and 0 <= col < self.size and position not in self.obstacles

    def reset(self):
        self.state = self.start
        return self.state

    def step(self, action):
        if action not in self.ACTIONS:
            raise ValueError("Action must be 0, 1, 2, or 3.")

        dr, dc = self.ACTIONS[action]
        row, col = self.state
        next_state = (row + dr, col + dc)

        if not self._valid_position(next_state):
            return StepResult(self.state, -5.0, False)

        self.state = next_state

        if self.state == self.goal:
            return StepResult(self.state, 100.0, True)

        return StepResult(self.state, -1.0, False)

    def render(self, path=None):
        path = set(path or [])
        rows = []

        for row in range(self.size):
            cells = []
            for col in range(self.size):
                position = (row, col)
                if position == self.start:
                    cell = "S"
                elif position == self.goal:
                    cell = "G"
                elif position in self.obstacles:
                    cell = "#"
                elif position in path:
                    cell = "*"
                else:
                    cell = "."
                cells.append(cell)
            rows.append(" ".join(cells))

        return "\n".join(rows)
