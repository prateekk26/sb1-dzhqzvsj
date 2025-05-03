import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface DatePickerProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  placeholder?: string;
  icon: LucideIcon;
  error?: string;
  optional?: boolean;
  min?: string;
  max?: string;
}

export function DatePicker({
  name,
  value,
  onChange,
  label,
  placeholder,
  icon: Icon,
  error,
  optional = false,
  min,
  max,
}: DatePickerProps) {
  return (
    <div>
      <label className="block text-gray-300 mb-2">
        {label} {optional && <span className="text-gray-500 text-sm">(optional)</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 ${
            error ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-[#FF8A00]'
          }`}
          placeholder={placeholder}
          min={min}
          max={max}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}