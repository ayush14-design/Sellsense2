import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
      <div className="text-4xl font-bold text-slate-900 mb-2">{value}</div>
      {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
    </div>
  );
};
