from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

Position = Tuple[int, int]


@dataclass
class StepResult:
    state: tuple
    reward: float
    done: bool


class GridEnvironment:
    """Grid world whose state contains local obstacle/goal information."""

    ACTIONS: Dict[int, Position] = {
        0: (-1, 0),  # up
        1: (1, 0),   # down
        2: (0, -1),  # left
        3: (0, 1),   # right
    }

    def __init__(
        self,
        size: int = 10,
        obstacles: List[Position] | None = None,
        start: Position = (0, 0),
        goal: Position | None = None,
    ) -> None:
        self.size = size
        self.start = start
        self.goal = goal if goal is not None else (size - 1, size - 1)
        self.obstacles = set(obstacles or [])
        self.state = self.start

        if not self._valid_position(self.start) or not self._valid_position(self.goal):
            raise ValueError("Start and goal must be valid free cells.")

    def _valid_position(self, position: Position) -> bool:
        row, col = position
        return (
            0 <= row < self.size
            and 0 <= col < self.size
            and position not in self.obstacles
        )

    def reset(self):
        self.state = self.start
        return self.get_state()

    def get_state(self):
        """Return agent position plus the complete grid layout.

        Including the layout makes different obstacle configurations distinct
        states, so experiences from different grids are not mixed blindly.
        """
        grid = tuple(
            1 if (row, col) in self.obstacles else 0
            for row in range(self.size)
            for col in range(self.size)
        )
        return (self.state, self.goal, grid)

    def step(self, action: int) -> StepResult:
        if action not in self.ACTIONS:
            raise ValueError("Action must be 0, 1, 2, or 3.")

        dr, dc = self.ACTIONS[action]
        row, col = self.state
        next_position = (row + dr, col + dc)

        if not self._valid_position(next_position):
            return StepResult(self.get_state(), -5.0, False)

        self.state = next_position

        if self.state == self.goal:
            return StepResult(self.get_state(), 100.0, True)

        return StepResult(self.get_state(), -1.0, False)

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
