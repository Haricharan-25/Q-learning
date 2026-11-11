import React from 'react';
import { MetricCards } from '../components/Analytics/MetricCards';
import { TrainingCharts } from '../components/Analytics/TrainingCharts';

export const LearningAnalyticsPage = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 6 Key Learning Metric Cards */}
      <MetricCards />

      {/* 4 Interactive Training Progression Graphs & Controller */}
      <TrainingCharts />
    </div>
  );
};

