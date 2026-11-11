import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Bot
} from 'lucide-react';
import { useQLearning } from '../../context/QLearningContext';

export const GridBoard = () => {
  const {
    gridSize,
    start,
    goal,
    obstacles,
    handleCellClick,
    editorMode,
    agentPos,
    simPath,
    simVisited,
    latestStep,
    activeLoopInfo,
  } = useQLearning();

  const isObstacle = (r, c) => obstacles.some(([or, oc]) => or === r && oc === c);
  const isStart = (r, c) => start[0] === r && start[1] === c;
  const isGoal = (r, c) => goal[0] === r && goal[1] === c;
  const isAgent = (r, c) => agentPos[0] === r && agentPos[1] === c;
  const isVisited = (r, c) => simVisited.some(([vr, vc]) => vr === r && vc === c);
  const isLoopCell = (r, c) => {
    return (
      activeLoopInfo &&
      activeLoopInfo.loop_cells &&
      activeLoopInfo.loop_cells.some(([lr, lc]) => lr === r && lc === c)
    );
  };

  const hasCollision = latestStep?.is_collision;
  const collisionTarget = latestStep?.collision_position;
  const isCollisionCell = (r, c) => {
    return (
      hasCollision &&
      collisionTarget &&
      collisionTarget[0] === r &&
      collisionTarget[1] === c
    );
  };

  const getArrowIcon = (actionName) => {
    switch (actionName) {
      case 'UP': return <ArrowUp className="w-4 h-4 text-[#E15B64]" />;
      case 'DOWN': return <ArrowDown className="w-4 h-4 text-[#E15B64]" />;
      case 'LEFT': return <ArrowLeft className="w-4 h-4 text-[#E15B64]" />;
      case 'RIGHT': return <ArrowRight className="w-4 h-4 text-[#E15B64]" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 rounded-[10px] bg-[#181B20] border border-[#282D35] flex flex-col items-center">
      {/* Grid Legend & Status Bar */}
      <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-[#282D35] text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[#45B880]/20 border border-[#45B880] flex items-center justify-center text-[9px] font-mono font-bold text-[#45B880]">S</span>
            <span className="text-[#9299A5]">Start</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[#E5A84B]/20 border border-[#E5A84B] flex items-center justify-center text-[9px] font-mono font-bold text-[#E5A84B]">G</span>
            <span className="text-[#9299A5]">Goal</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[#21262D] border border-[#282D35]"></span>
            <span className="text-[#9299A5]">Obstacle</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#5B8DEF] border border-[#5B8DEF]"></span>
            <span className="text-[#9299A5]">Agent</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[#14171B] border border-[#282D35]"></span>
            <span className="text-[#9299A5]">Visited</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="text-[#666D78]">Editor Mode:</span>
          <span className="px-2 py-0.5 rounded-[4px] bg-[#21262D] text-[#E6E8EB] font-semibold uppercase border border-[#282D35]">
            {editorMode}
          </span>
        </div>
      </div>

      {/* 6x6 Grid Container - Exact 64px Cells */}
      <div
        className="grid gap-2 p-3 bg-[#14171B] rounded-[10px] border border-[#282D35] relative select-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 64px)`,
          gridTemplateRows: `repeat(${gridSize}, 64px)`,
          width: 'fit-content',
        }}
      >
        {Array.from({ length: gridSize }).map((_, r) =>
          Array.from({ length: gridSize }).map((_, c) => {
            const obstacle = isObstacle(r, c);
            const startCell = isStart(r, c);
            const goalCell = isGoal(r, c);
            const agentCell = isAgent(r, c);
            const visitedCell = isVisited(r, c);
            const collisionCell = isCollisionCell(r, c);
            const loopCell = isLoopCell(r, c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`w-[64px] h-[64px] relative rounded-[6px] flex items-center justify-center transition-colors cursor-pointer group overflow-hidden ${
                  obstacle
                    ? collisionCell
                      ? 'bg-[#E15B64]/20 border-2 border-[#E15B64] animate-collision-shake'
                      : 'bg-[#21262D] border border-[#282D35] hover:border-[#666D78]'
                    : startCell
                    ? 'bg-[#45B880]/15 border border-[#45B880]'
                    : goalCell
                    ? 'bg-[#E5A84B]/15 border border-[#E5A84B]'
                    : loopCell
                    ? 'bg-[#E5A84B]/10 border border-[#E5A84B]/80'
                    : visitedCell
                    ? 'bg-[#181B20] border border-[#282D35] hover:border-[#5B8DEF]/40'
                    : 'bg-[#14171B] border border-[#282D35] hover:border-[#5B8DEF]/40 hover:bg-[#181B20]'
                }`}
              >
                {/* Cell Coordinate Label */}
                <span className="absolute top-1 left-1.5 text-[9px] font-mono text-[#666D78] group-hover:text-[#9299A5]">
                  {r},{c}
                </span>

                {/* Loop cell indicator badge */}
                {loopCell && !agentCell && (
                  <span className="absolute top-1 right-1 px-1 text-[8px] font-mono font-bold bg-[#E5A84B]/20 text-[#E5A84B] rounded-[3px]">
                    LOOP
                  </span>
                )}

                {/* Obstacle Cell representation */}
                {obstacle && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-mono font-bold text-[#666D78]">
                      #
                    </span>
                    {collisionCell && (
                      <span className="text-[8px] font-mono font-bold text-[#E15B64] uppercase">
                        HIT
                      </span>
                    )}
                  </div>
                )}

                {/* Start Marker */}
                {startCell && !agentCell && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-mono font-bold text-[#45B880]">
                      START
                    </span>
                  </div>
                )}

                {/* Goal Marker */}
                {goalCell && !agentCell && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-mono font-bold text-[#E5A84B]">
                      GOAL
                    </span>
                  </div>
                )}

                {/* Visited Footprint Indicator */}
                {visitedCell && !obstacle && !startCell && !goalCell && !agentCell && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5B8DEF]/40"></div>
                )}

                {/* Agent Token with Framer Motion (small, intentional transition) */}
                {agentCell && (
                  <motion.div
                    layoutId="q-learning-agent"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                    className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border ${
                      hasCollision
                        ? 'bg-[#E15B64] border-[#E6E8EB] text-[#E6E8EB] animate-collision-shake'
                        : 'bg-[#5B8DEF] border-[#E6E8EB] text-[#0D0F12]'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                  </motion.div>
                )}

                {/* Collision Attempt Arrow & Penalty Popup */}
                {hasCollision && isAgent(r, c) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="absolute -top-2.5 px-1.5 py-0.2 rounded-[4px] bg-[#E15B64] text-[#E6E8EB] font-mono font-bold text-[9px] border border-[#E15B64]">
                      {latestStep.reward}
                    </div>
                    <div className="p-0.5 rounded-full bg-[#181B20] border border-[#E15B64]">
                      {getArrowIcon(latestStep.action_name)}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Grid Coordinates Footer Telemetry */}
      <div className="w-full flex items-center justify-between mt-3 pt-3 border-t border-[#282D35] text-xs font-mono text-[#9299A5]">
        <div>
          <span>Agent Pos: </span>
          <span className="text-[#5B8DEF] font-bold">({agentPos[0]}, {agentPos[1]})</span>
        </div>
        <div>
          <span>Path Steps: </span>
          <span className="text-[#8A7AFF] font-bold">{Math.max(0, simPath.length - 1)}</span>
        </div>
        <div>
          <span>Goal: </span>
          <span className="text-[#E5A84B] font-bold">({goal[0]}, {goal[1]})</span>
        </div>
      </div>
    </div>
  );
};
