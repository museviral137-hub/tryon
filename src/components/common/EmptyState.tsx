import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border-2 border-dashed border-neutral-200 bg-white/60">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 mb-4 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-semibold shadow-sm transition-all"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionText}
        </button>
      )}
    </div>
  );
};
