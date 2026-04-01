'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.login, form.password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔩</div>
          <h1 className="text-2xl font-bold text-white">Сервисный центр</h1>
          <p className="text-gray-400 text-sm mt-1">Система управления ремонтами</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Вход в систему</h2>
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Логин</label>
              <input className="input" type="text" placeholder="Введите логин" value={form.login}
                onChange={e => setForm(f => ({ ...f, login: e.target.value }))} required autoComplete="username" />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password" placeholder="Введите пароль" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? <span className="flex items-center gap-2 justify-center"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Вход…</span> : 'Войти'}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-2">Тестовые учётные записи:</p>
            <div className="space-y-1 text-xs text-gray-500 text-center">
              <div>admin / admin123</div>
              <div>receiver1 / receiver123</div>
              <div>master1 / master123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
