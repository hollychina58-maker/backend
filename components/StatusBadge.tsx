'use client';

interface StatusBadgeProps {
  status: 'published' | 'draft' | 'error' | 'success' | 'warning';
  children?: React.ReactNode;
}

const statusStyles = {
  published: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  draft: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const label = children ?? (status === 'published' ? '已发布' : status === 'draft' ? '草稿' : status);
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-xs font-medium
        ${statusStyles[status]}
      `}
    >
      {label}
    </span>
  );
}
