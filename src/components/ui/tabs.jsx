'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext(null);

function Tabs({
  className,
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  ...props
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ''
  );

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : uncontrolledValue;

  const setActiveValue = React.useCallback(
    (val) => {
      if (!isControlled) {
        setUncontrolledValue(val);
      }
      if (onValueChange) {
        onValueChange(val);
      }
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue }}>
      <div
        data-slot="tabs"
        className={cn('flex flex-col gap-2', className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1',
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, value, active, onClick, ...props }) {
  const context = React.useContext(TabsContext);
  const isActive = context ? context.activeValue === value : active;

  const handleClick = (e) => {
    if (context && value) {
      context.setActiveValue(value);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={isActive ? 'active' : 'inactive'}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:text-foreground text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, value, active, ...props }) {
  const context = React.useContext(TabsContext);
  const isActive = context ? context.activeValue === value : active;

  if (!isActive) return null;

  return (
    <div
      data-slot="tabs-content"
      data-state={isActive ? 'active' : 'inactive'}
      className={cn('mt-2', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
