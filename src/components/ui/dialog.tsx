import React from 'react';

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Dialog = ({ children, open, onOpenChange, ...props }: DialogProps) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" {...props}>
      {children}
    </div>
  );
};

export const DialogTrigger = ({ children, ...props }: DialogTriggerProps) => {
  return <div {...props}>{children}</div>;
};

export const DialogContent = ({ children, ...props }: DialogContentProps) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      {...props}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ children, ...props }: DialogHeaderProps) => {
  return <div className="flex flex-col space-y-1.5 text-center sm:text-left" {...props}>{children}</div>;
};

export const DialogTitle = ({ children, ...props }: DialogTitleProps) => {
  return <h3 className="text-lg font-semibold leading-none tracking-tight" {...props}>{children}</h3>;
};

export const DialogDescription = ({ children, ...props }: DialogDescriptionProps) => {
  return <p className="text-sm text-gray-500" {...props}>{children}</p>;
};

export const DialogFooter = ({ children, ...props }: DialogFooterProps) => {
  return <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2" {...props}>{children}</div>;
};