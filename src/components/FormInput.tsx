import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

// Validation function type
export type ValidationFunction = (value: string) => { valid: boolean; message?: string };

interface FormInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  placeholder?: string;
  type?: string;
  icon: LucideIcon;
  error?: string;
  optional?: boolean;
  validation?: ValidationFunction;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  helpText?: string;
}

export function FormInput({
  name,
  value,
  onChange,
  label,
  placeholder,
  type = 'text',
  icon: Icon,
  error,
  optional = false,
  validation,
  onBlur,
  helpText,
}: FormInputProps) {
  // Handle blur event with validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          className={`w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 ${
            error ? 'border border-red-500 focus:ring-red-500' : 'focus:ring-[#FF8A00]'
          }`}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        />
      </div>
      {error && <p id={`${name}-error`} className="text-red-500 text-sm mt-1" role="alert">{error}</p>}
      {helpText && !error && <p id={`${name}-help`} className="text-gray-400 text-sm mt-1">{helpText}</p>}
    </div>
  );
}