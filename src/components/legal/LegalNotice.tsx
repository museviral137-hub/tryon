import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles, Info } from 'lucide-react';

interface LegalNoticeProps {
  type?: 'info' | 'warning' | 'alert' | 'highlight';
  title?: string;
  children: React.ReactNode;
  id?: string;
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({
  type = 'info',
  title,
  children,
  id,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          wrapper: 'bg-amber-50/80 border-amber-200/90 text-amber-950',
          title: 'text-amber-900',
          body: 'text-amber-900/90',
          icon: <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />,
        };
      case 'alert':
        return {
          wrapper: 'bg-rose-50/80 border-rose-200/90 text-rose-950',
          title: 'text-rose-900',
          body: 'text-rose-900/90',
          icon: <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />,
        };
      case 'highlight':
        return {
          wrapper: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950',
          title: 'text-emerald-900',
          body: 'text-emerald-900/90',
          icon: <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />,
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-neutral-50 border-neutral-200 text-neutral-900',
          title: 'text-neutral-900',
          body: 'text-neutral-600',
          icon: <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      id={id}
      className={`p-4 sm:p-5 rounded-2xl border ${styles.wrapper} space-y-1.5 transition-all`}
    >
      <div className="flex items-start gap-2.5">
        {styles.icon}
        <div className="space-y-1 min-w-0">
          {title && (
            <h4 className={`font-display font-bold text-xs sm:text-sm ${styles.title}`}>
              {title}
            </h4>
          )}
          <div className={`text-xs sm:text-sm leading-relaxed ${styles.body}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
