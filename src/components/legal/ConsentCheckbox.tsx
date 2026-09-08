import React from 'react';

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  required = false,
  error = false,
  disabled = false,
}) => {
  return (
    <div className="flex items-start gap-2.5 group">
      <div className="relative flex items-center justify-center pt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          disabled={disabled}
          className={`w-4 h-4 rounded-md border text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-1 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed transition-all ${
            error
              ? 'border-rose-400 ring-2 ring-rose-200'
              : 'border-neutral-300 group-hover:border-neutral-400'
          }`}
        />
      </div>
      <label
        htmlFor={id}
        className={`text-xs sm:text-sm leading-snug cursor-pointer select-none ${
          disabled ? 'text-neutral-400 cursor-not-allowed' : 'text-neutral-700'
        } ${error ? 'text-rose-700 font-medium' : ''}`}
      >
        {label}
      </label>
    </div>
  );
};
