import React, { ButtonHTMLAttributes } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  isLoading?: boolean;
}

export function IconButton({
  icon: Icon,
  variant = 'default',
  size = 'md',
  label,
  isLoading = false,
  className = '',
  disabled,
  onClick,
  ...props
}: IconButtonProps) {
  const baseStyles = 'rounded-full flex items-center justify-center transition-colors';
  
  const variantStyles = {
    default: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
    primary: 'bg-[#FF8A00] text-white hover:bg-[#E67A00]',
    secondary: 'bg-gray-600 text-white hover:bg-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-700',
  };
  
  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };
  
  const iconSizeStyles = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={isLoading || disabled}
      aria-label={label}
      title={label}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <svg className={`animate-spin ${iconSizeStyles[size]} text-current`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Icon className={iconSizeStyles[size]} />
      )}
    </button>
  );
}