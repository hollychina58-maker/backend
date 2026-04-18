'use client';

import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedId?: string;
  emptyMessage?: string;
  getRowId?: (row: T) => string;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedId,
  emptyMessage = '暂无数据',
  getRowId,
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, idx) => {
              const rowId = getRowId ? getRowId(row) : String(idx);
              const isSelected = selectedId === rowId;
              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
