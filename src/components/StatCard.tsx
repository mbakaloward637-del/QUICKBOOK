import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  bgColor,
}) => {
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-slate-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="p-3 bg-white rounded-lg">{icon}</div>
      </div>
    </div>
  );
};
