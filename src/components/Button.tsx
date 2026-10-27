import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

  // Only match actual Tailwind text color utilities, NOT font sizes (text-sm, text-base, etc.) or alignments (text-center, text-left)
  const hasCustomTextColor = /\btext-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-[0-9]{2,3})?\b|\btext-(?:transparent|current)\b/.test(className);
  const hasBgWhite = className.includes('bg-white');

  const variantClasses = {
    primary: (hasBgWhite && !hasCustomTextColor)
      ? 'bg-lime-500 text-slate-900 hover:bg-lime-600 shadow-sm hover:shadow-md'
      : hasCustomTextColor
      ? 'bg-lime-400 hover:bg-lime-500 shadow-sm hover:shadow-md'
      : 'bg-lime-400 text-slate-950 font-bold hover:bg-lime-500 shadow-sm hover:shadow-md',
    secondary: hasCustomTextColor
      ? 'bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700'
      : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700',
    outline: hasCustomTextColor
      ? 'border-2 border-slate-700 hover:bg-slate-700 hover:text-white dark:border-slate-400'
      : 'border-2 border-slate-700 text-slate-900 hover:bg-slate-700 hover:text-white dark:border-slate-400 dark:text-white',
    ghost: hasCustomTextColor
      ? 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
      : 'bg-transparent text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200',
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
