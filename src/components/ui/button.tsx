import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'default',
  ...props 
}: ButtonProps) => {
  let baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  let variantStyles = "";
  switch (variant) {
    case 'default':
      variantStyles = "bg-blue-500 text-white hover:bg-blue-600 shadow";
      break;
    case 'destructive':
      variantStyles = "bg-red-500 text-white hover:bg-red-600 shadow-sm";
      break;
    case 'outline':
      variantStyles = "border border-input bg-transparent shadow-sm hover:bg-gray-100 hover:text-gray-900";
      break;
    case 'secondary':
      variantStyles = "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200";
      break;
    case 'ghost':
      variantStyles = "hover:bg-gray-100 hover:text-gray-900";
      break;
  }
  
  let sizeStyles = "";
  switch (size) {
    case 'default':
      sizeStyles = "h-9 px-4 py-2";
      break;
    case 'sm':
      sizeStyles = "h-8 rounded-md px-3 text-xs";
      break;
    case 'lg':
      sizeStyles = "h-10 rounded-md px-8";
      break;
    case 'icon':
      sizeStyles = "h-9 w-9";
      break;
  }

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};