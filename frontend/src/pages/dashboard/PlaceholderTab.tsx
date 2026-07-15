import React from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import type { LucideIcon } from 'lucide-react';

interface PlaceholderTabProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ title, description, icon }) => {
  return (
    <div className="h-[60vh] flex items-center justify-center">
      <EmptyState
        title={`${title} — Coming Soon`}
        description={description}
        icon={icon}
      />
    </div>
  );
};
