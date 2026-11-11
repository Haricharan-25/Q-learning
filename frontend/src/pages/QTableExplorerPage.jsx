import React, { useState, useEffect } from 'react';
import { QTableGrid } from '../components/QTableExplorer/QTableGrid';
import { StateActionChart } from '../components/QTableExplorer/StateActionChart';
import { BellmanCalculator } from '../components/QTableExplorer/BellmanCalculator';
import { useQLearning } from '../context/QLearningContext';

export const QTableExplorerPage = () => {
  const { qTable, latestStep, agentPos } = useQLearning();
  const [selectedState, setSelectedState] = useState(null);

  // Default selection to current agent state or start state
  useEffect(() => {
    if (!selectedState && qTable.length > 0) {
      const activeState = qTable.find((s) => s.is_agent) || qTable[0];
      setSelectedState(activeState);
    } else if (selectedState && qTable.length > 0) {
      // Keep selected state updated with latest values
      const updated = qTable.find((s) => s.id === selectedState.id);
      if (updated) setSelectedState(updated);
    }
  }, [qTable, selectedState]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full Table Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <QTableGrid
            onSelectState={(st) => setSelectedState(st)}
            selectedStateId={selectedState?.id}
          />
        </div>

        {/* Right Column: Selected State Action Comparison & Bellman Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <StateActionChart selectedStateData={selectedState} />
          <BellmanCalculator />
        </div>
      </div>
    </div>
  );
};

