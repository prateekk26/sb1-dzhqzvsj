import React, { forwardRef } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  placeholder?: string;
  icon: LucideIcon;
  error?: string;
  optional?: boolean;
  min?: string;
  max?: string;
  helpText?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>((
  {
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
    helpText,
    className,
    ...props
  },
  ref
) => {
  const inputClasses = `
    w-full 
    pl-10 
    pr-4 
    py-3 
    bg-gray-700 
    text-white 
    rounded-lg 
    focus:outline-none 
    focus:ring-2 
    ${error ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-[#FF8A00]'}
    ${className || ''}
  `;

  return (
    <div>
      <label className="block text-gray-300 mb-2" htmlFor={name}>
        {label} {optional && <span className="text-gray-500 text-sm">(optional)</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          ref={ref}
          type="date"
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          className={inputClasses}
          placeholder={placeholder}
          min={min}
          max={max}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${name}-error`} className="text-red-500 text-sm mt-1" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${name}-help`} className="text-gray-400 text-sm mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';