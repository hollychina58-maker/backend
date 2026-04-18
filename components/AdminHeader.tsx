'use client';

interface AdminHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function AdminHeader({ title, children }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </header>
  );
}
