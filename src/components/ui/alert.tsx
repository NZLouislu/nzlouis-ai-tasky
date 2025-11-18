import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Alert = ({ children, variant = 'default', ...props }: AlertProps) => {
  const variantClasses = variant === 'destructive' 
    ? 'border-red-500 text-red-500' 
    : 'border-gray-200';
    
  return (
    <div className={`rounded-lg border p-4 ${variantClasses}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, ...props }: AlertDescriptionProps) => {
  return (
    <div className="text-sm" {...props}>
      {children}
    </div>
  );
};