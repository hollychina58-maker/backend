'use client';

import { useState, useCallback } from 'react';
import { getAuthHeader } from '../lib/api-auth';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件');
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'products');

        const authHeader = getAuthHeader();
        // Don't set Content-Type for FormData - browser needs to set it with boundary
        delete authHeader['Content-Type'];

        console.log('[ImageUpload] Sending request to /api/upload');
        console.log('[ImageUpload] Auth header present:', !!authHeader['Authorization']);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: authHeader,
          body: formData,
        });

        console.log('[ImageUpload] Response status:', res.status);

        const data = await res.json();
        console.log('[ImageUpload] Response data:', data);

        if (!res.ok) {
          throw new Error(data.error || `上传失败 (${res.status})`);
        }

        onChange(data.url);
      } catch (err) {
        console.error('[ImageUpload] Upload error:', err);
        setError(err instanceof Error ? err.message : '图片上传失败');
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
        <div className="space-y-1 text-center">
          {value ? (
            <div className="relative">
              <img src={value} alt="Preview" className="mx-auto h-32 w-auto object-contain rounded-lg" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                <label className="relative cursor-pointer rounded-md font-medium text-[#0066ff] hover:text-[#0052cc] focus-within:outline-none">
                  <span>上传文件</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="pl-1">或拖拽上传</p>
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, GIF 最大 10MB</p>
            </>
          )}
          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#0066ff]">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              上传中...
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
