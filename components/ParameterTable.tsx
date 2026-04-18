'use client';

import { Button } from './Button';
import { Input } from './Input';

export interface SpecItem {
  name: string;
  value: string;
  unit?: string;
}

interface ParameterTableProps {
  specs: SpecItem[];
  onChange: (specs: SpecItem[]) => void;
}

export function ParameterTable({ specs, onChange }: ParameterTableProps) {
  const addSpec = () => {
    onChange([...specs, { name: '', value: '', unit: '' }]);
  };

  const updateSpec = (index: number, field: keyof SpecItem, value: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    onChange(newSpecs);
  };

  const removeSpec = (index: number) => {
    onChange(specs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          参数
        </label>
        <Button variant="ghost" size="sm" onClick={addSpec}>
          + 添加参数
        </Button>
      </div>
      {specs.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
          暂无参数
        </p>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  名称
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  数值
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  单位
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {specs.map((spec, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <Input
                      value={spec.name}
                      onChange={(e) => updateSpec(index, 'name', e.target.value)}
                      placeholder="例如：精度"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={spec.value}
                      onChange={(e) => updateSpec(index, 'value', e.target.value)}
                      placeholder="例如：0.1°"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={spec.unit || ''}
                      onChange={(e) => updateSpec(index, 'unit', e.target.value)}
                      placeholder="例如：度"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeSpec(index)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
