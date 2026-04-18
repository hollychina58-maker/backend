'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5',
  secondary:
    'bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 hover:-translate-y-0.5',
  ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-150 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {rightIcon && !loading && rightIcon}
    </button>
  );
}