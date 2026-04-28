'use client';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

export default function LoginPage() {
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

        <form className="space-y-4">
          <Input
            type="password"
            label="密码"
            placeholder="请输入管理员密码"
          />

          <Button className="w-full">
            登录
          </Button>
        </form>
      </div>
    </div>
  );
}
