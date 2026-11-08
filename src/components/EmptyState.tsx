import React, { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  line?: string;
  action?: ReactNode;
}

export const LoadingRow: React.FC<{ text: string }> = ({ text }) => (
  <p role="status" className="px-4 py-6 text-secondary text-ink-secondary">{text}</p>
);

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, line, action }) => (
  <div className="px-4 py-8">
    <Icon className="w-10 h-10 text-ink-secondary" aria-hidden="true" />
    <h2 className="mt-3 text-section font-bold">{title}</h2>
    {line && <p className="mt-1 text-secondary text-ink-secondary">{line}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
