import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

// Validation function type
export type ValidationFunction = (value: string) => { valid: boolean; message?: string };

interface TextAreaProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  rows?: number;
  optional?: boolean;
  validation?: ValidationFunction;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  helpText?: string;
  maxLength?: number;
}

export function TextArea({
  name,
  value,
  onChange,
  label,
  placeholder,
  icon: Icon,
  error,
  rows = 4,
  optional = false,
  validation,
  onBlur,
  helpText,
  maxLength,
}: TextAreaProps) {
  // Calculate character count and limit
  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;
  const isAtLimit = maxLength && charCount >= maxLength;

  // Handle blur event with validation
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Run validation if provided
    if (validation && e.target.value) {
      const result = validation(e.target.value);
      if (!result.valid && result.message) {
        // This would need to be handled by the parent component
        console.log('Validation error:', result.message);
      }
    }
    
    // Call the provided onBlur handler if any
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div>
      <label className="block text-gray-300 mb-2">
        {label} {optional && <span className="text-gray-500 text-sm">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
        )}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          rows={rows}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 ${
            error ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-[#FF8A00]'
          }`}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        />
      </div>
      {error && <p id={`${name}-error`} className="text-red-500 text-sm mt-1" role="alert">{error}</p>}
      {helpText && !error && <p id={`${name}-help`} className="text-gray-400 text-sm mt-1">{helpText}</p>}
      {maxLength && (
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-400'}`}>
            {charCount}/{maxLength} characters
          </span>
        </div>
      )}
    </div>
  );
}