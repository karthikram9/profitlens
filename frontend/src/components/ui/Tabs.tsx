import React from 'react';
import { cn } from '../../lib/utils';

export interface TabOption {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div className={cn("border-b border-border w-full", className)}>
      <nav className="flex gap-lg -mb-[2px]" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "py-md px-xs font-semibold text-sm border-b-2 transition-all duration-base outline-none cursor-pointer",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary hover:border-border"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
export default Tabs;
