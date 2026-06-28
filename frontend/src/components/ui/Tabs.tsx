import * as TabsPrimitive from '@radix-ui/react-tabs';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.List
      className={clsx(
        'inline-flex flex-wrap gap-2',
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
        'text-dark-400 hover:text-dark-200 hover:bg-dark-800/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-dark-800 data-[state=active]:text-dark-100',
        className
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={clsx(
        'mt-4 focus-visible:outline-none',
        'data-[state=inactive]:hidden',
        className
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
