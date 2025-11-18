import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, ...props }: CardProps) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, ...props }: CardHeaderProps) => {
  return (
    <div className="flex flex-col space-y-1.5 p-6" {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, ...props }: CardTitleProps) => {
  return (
    <h3 className="text-2xl font-semibold leading-none tracking-tight" {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, ...props }: CardContentProps) => {
  return (
    <div className="p-6 pt-0" {...props}>
      {children}
    </div>
  );
};

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