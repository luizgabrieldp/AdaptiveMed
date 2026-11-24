'use client';

import React from 'react';
import { useData } from '@/lib/store/data-context';
import { ActivityHeatmapView } from './activity-heatmap-view';

export { ActivityHeatmapView } from './activity-heatmap-view';
export type { ActivityHeatmapViewProps } from './activity-heatmap-view';

export const ActivityHeatmap: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { topics, reviews, mockExams, institutionExams } = useData();
  return (
    <ActivityHeatmapView
      topics={topics}
      reviews={reviews}
      mockExams={mockExams}
      institutionExams={institutionExams}
      compact={compact}
    />
  );
};
