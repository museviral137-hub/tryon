import React from 'react';

interface LegalSectionProps {
  id?: string;
  number?: string | number;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const LegalSection: React.FC<LegalSectionProps> = ({
  id,
  number,
  title,
  children,
  icon,
}) => {
  return (
    <section id={id} className="scroll-mt-20 space-y-3 pt-6 first:pt-0 border-t border-neutral-100 first:border-t-0">
      <div className="flex items-center gap-2.5">
        {number && (
          <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {number}
          </span>
        )}
        {icon && !number && (
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <h2 className="font-display font-bold text-base sm:text-lg text-neutral-900 leading-snug">
          {title}
        </h2>
      </div>

      <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed space-y-3 pl-0 sm:pl-9.5">
        {children}
      </div>
    </section>
  );
};
