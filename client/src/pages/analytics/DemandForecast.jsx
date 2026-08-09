import React from 'react';
import { FiTrendingUp, FiPackage, FiBarChart2 } from 'react-icons/fi';
import ReportPage, { ChartPlaceholder } from '../../components/ReportPage';
import DataTable from '../../components/DataTable';
import { forecastData } from '../../config/mockData';

const DemandForecast = () => (
  <ReportPage
    title="Demand Forecast"
    description="AI-powered demand predictions to optimize inventory planning."
    stats={[
      { icon: FiTrendingUp, label: 'Avg. Confidence', value: '86%', bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiPackage, label: 'Items Forecasted', value: forecastData.length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiBarChart2, label: 'Reorder Suggested', value: 3, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
  >
    <ChartPlaceholder title="30-Day Demand Forecast" height="h-80" />
    <DataTable
      columns={[
        { key: 'medicine', label: 'Medicine' },
        { key: 'current', label: 'Current Stock' },
        { key: 'forecast', label: '30-Day Forecast' },
        { key: 'confidence', label: 'Confidence' },
      ]}
      data={forecastData}
    />
  </ReportPage>
);

export default DemandForecast;
