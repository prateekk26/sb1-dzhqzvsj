import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X, DivideIcon as LucideIcon } from 'lucide-react';

type AlertVariant = 'error' | 'success' | 'warning' | 'info' | 'debug';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
  icon?: LucideIcon;
  dismissable?: boolean;
  autoClose?: number; // Time in ms after which the alert will auto-close
}

export function Alert({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
  icon: CustomIcon,
  dismissable = true,
  autoClose
}: AlertProps) {
  const variantStyles = {
    error: {
      container: 'bg-red-900/50 border-red-500 text-red-200',
      icon: <AlertCircle className="h-5 w-5 text-red-400" />,
    },
    success: {
      container: 'bg-green-900/50 border-green-500 text-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    },
    warning: {
      container: 'bg-yellow-900/50 border-yellow-500 text-yellow-200',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    },
    info: {
      container: 'bg-blue-900/50 border-blue-500 text-blue-200',
      icon: <Info className="h-5 w-5 text-blue-400" />,
    },
    debug: {
      container: 'bg-purple-900/50 border-purple-500 text-purple-200',
      icon: <AlertCircle className="h-5 w-5 text-purple-400" />,
    },
  };

  const { container, icon } = variantStyles[variant];
  
  // Use the custom icon if provided, otherwise use the default icon for the variant
  const IconComponent = CustomIcon ? <CustomIcon className="h-5 w-5 text-blue-400" /> : icon;

  // Set up auto-close timer if specified
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div className={`border px-4 py-3 rounded flex items-start ${container} ${className} animate-fadeIn`}>
      <div className="flex-shrink-0 mr-3 mt-0.5">{IconComponent}</div>
      <div className="flex-1">
        {title && <div className="font-medium mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>
      {onClose && dismissable && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-700/50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}