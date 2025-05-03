import React, { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  loadingText,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}, ref) => {
  // Base button styles
  const baseStyles = 'rounded-lg font-medium transition-colors flex items-center justify-center';
  
  // Variant-specific styles
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#FF8A00] hover:bg-[#E67A00] text-white disabled:opacity-50 disabled:hover:bg-[#FF8A00]',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:hover:bg-gray-700',
    outline: 'bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 disabled:opacity-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:hover:bg-red-600',
    success: 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:hover:bg-green-600',
  };
  
  // Size-specific styles
  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'text-xs py-1 px-2',
    sm: 'text-sm py-2 px-3',
    md: 'py-3 px-4',
    lg: 'text-lg py-4 px-6',
  };
  
  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  return (
    <button
      ref={ref}
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="h-4 w-4 mr-2 flex-shrink-0" />}
          {children}
          {RightIcon && <RightIcon className="h-4 w-4 ml-2 flex-shrink-0" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';