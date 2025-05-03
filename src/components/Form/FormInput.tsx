import React, { forwardRef } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name?: string;
  label: string;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  optional?: boolean;
  helpText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>((
  {
    name,
    value,
    onChange,
    label,
    placeholder,
    type = 'text',
    icon: Icon,
    error,
    optional = false,
    helpText,
    className,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref
) => {
  const inputClasses = `
    w-full
    ${Icon ? 'pl-10' : 'pl-4'} 
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
      <label className="block text-gray-300 mb-2">
        {label} {optional && <span className="text-gray-500 text-sm">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        )}
        <input
          ref={ref}
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          className={inputClasses}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : ariaDescribedBy}
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

FormInput.displayName = 'FormInput';