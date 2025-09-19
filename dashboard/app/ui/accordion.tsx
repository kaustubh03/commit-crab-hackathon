import * as React from 'react';
import { cn } from './cn';

interface AccordionContextValue {
  value: string | null;
  setValue: (v: string | null) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps {
  type?: 'single';
  collapsible?: boolean;
  defaultValue?: string | null;
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  defaultValue = null,
  className,
}) => {
  const [value, setValue] = React.useState<string | null>(defaultValue);
  return (
    <AccordionContext.Provider value={{ value, setValue }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

export interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
}
export const AccordionItem: React.FC<AccordionItemProps> = ({ value, children }) => {
  return <div data-value={value}>{children}</div>;
};

export interface AccordionTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
}
export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  value,
  className,
  ...props
}) => {
  const ctx = React.useContext(AccordionContext)!;
  const open = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(open ? null : value)}
      className={cn(
        'flex w-full items-center justify-between rounded-md bg-accent/40 px-3 py-2 text-left text-sm font-medium hover:bg-accent/60',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <span className="ml-2 text-xs text-muted-foreground">{open ? '−' : '+'}</span>
    </button>
  );
};

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}
export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  value,
  className,
  ...props
}) => {
  const ctx = React.useContext(AccordionContext)!;
  const open = ctx.value === value;
  if (!open) return null;
  return (
    <div
      className={cn(
        'rounded-md border border-accent bg-background px-3 py-3 text-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
