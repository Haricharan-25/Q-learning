from __future__ import annotations

import random
from collections import defaultdict


class QLearningAgent:
    def __init__(self, learning_rate=0.1, discount_factor=0.95,
                 epsilon=1.0, epsilon_decay=0.995, epsilon_min=0.05, actions=4):
        self.alpha = learning_rate
        self.gamma = discount_factor
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.actions = actions
        self.q_table = defaultdict(lambda: [0.0] * actions)

    def choose_action(self, state, training=True):
        if training and random.random() < self.epsilon:
            return random.randrange(self.actions)

        values = self.q_table[state]
        maximum = max(values)
        best = [i for i, value in enumerate(values) if value == maximum]
        return random.choice(best)

    def learn(self, state, action, reward, next_state, done):
        current = self.q_table[state][action]
        next_max = 0.0 if done else max(self.q_table[next_state])
        target = reward + self.gamma * next_max
        self.q_table[state][action] += self.alpha * (target - current)

    def end_episode(self):
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
