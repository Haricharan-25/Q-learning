import React from 'react';
import { GridBoard } from '../components/GridSimulator/GridBoard';
import { GridControls } from '../components/GridSimulator/GridControls';
import { StepDetails } from '../components/GridSimulator/StepDetails';
import { AgentThinking } from '../components/GridSimulator/AgentThinking';
import { CollisionAlert } from '../components/GridSimulator/CollisionAlert';
import { LoopAlert } from '../components/GridSimulator/LoopAlert';

export const GridSimulatorPage = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Loop Detected Alert Banner */}
      <LoopAlert />

      {/* Obstacle Collision Alert Banner when collision occurs */}
      <CollisionAlert />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Grid World and Agent Thinking (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <GridBoard />
          <AgentThinking />
        </div>

        {/* Right Column: Controls and Step Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GridControls />
          <StepDetails />
        </div>
      </div>
    </div>
  );
};

