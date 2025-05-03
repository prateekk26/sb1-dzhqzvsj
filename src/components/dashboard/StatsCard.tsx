import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatsCard({ icon: Icon, title, value, subtitle, color = 'text-white' }: StatsCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-[#FF8A00]" />
        <span className="text-sm font-medium text-gray-400">{title}</span>
      </div>
      <div className="flex items-center">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {subtitle && (
          <span className="text-sm text-gray-500 ml-2">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}