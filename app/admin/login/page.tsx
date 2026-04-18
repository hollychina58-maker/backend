'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        router.push('/admin');
      } else {
        setError(data.error || '登录失败');
      }
    } catch {
      setError('发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff] flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MMES-MCTI</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理员登录</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="password"
            label="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入管理员密码"
            error={error}
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            登录
          </Button>
        </form>
      </div>
    </div>
  );
}
