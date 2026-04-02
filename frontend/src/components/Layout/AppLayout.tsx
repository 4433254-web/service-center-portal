'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import GlobalSearch from '@/components/ui/GlobalSearch';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 text-sm animate-pulse">Загрузка…</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Сайдбар десктоп */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Мобильный сайдбар */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Топбар десктоп — поиск */}
        <div className="hidden md:flex items-center px-6 py-3 bg-white border-b border-gray-200 gap-4">
          <div className="flex-1 max-w-lg">
            <GlobalSearch />
          </div>
        </div>

        {/* Мобильная шапка */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <button onClick={() => setSidebarOpen(true)} className="text-xl p-1">☰</button>
            <span className="font-semibold text-sm">🔩 СервисЦентр</span>
            <div className="w-8" />
          </div>
          {/* Поиск под шапкой на мобиле */}
          <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 pb-3">
            <GlobalSearch />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
