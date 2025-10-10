// IntelligenceChart Component for ProspectPI Intelligence Theater
'use client';

import React from 'react';

interface IntelligenceChartProps {
  data: any;
}

// Simple chart component placeholder - can be enhanced with actual charting library later
export const IntelligenceChart: React.FC<IntelligenceChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl text-blue-600 mb-2"></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Intelligence Chart</h3>
        <p className="text-sm text-gray-500">Chart visualization will be displayed here</p>
        {data && (
          <div className="mt-2 text-xs text-gray-400">
            Data points: {Array.isArray(data) ? data.length : 'Available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceChart;
