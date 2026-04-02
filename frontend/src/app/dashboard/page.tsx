'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/helpers';

interface Stats {
  accepted: number;
  in_diagnostics: number;
  waiting_approval: number;
  in_progress: number;
  ready: number;
  issued_today: number;
  active: number;
}

const statCards = [
  { key: 'accepted',       label: 'Принято',         icon: '📥', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'in_diagnostics', label: 'На диагностике',  icon: '🔬', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: 'in_progress',    label: 'В работе',        icon: '🔧', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { key: 'ready',          label: 'Готово к выдаче', icon: '✅', color: 'bg-green-50 border-green-200 text-green-700' },
  { key: 'issued_today',   label: 'Выдано сегодня',  icon: '📤', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { key: 'active',         label: 'Всего активных',  icon: '📊', color: 'bg-gray-50 border-gray-200 text-gray-700' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ stats: Stats; recent_orders: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user?.login}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Карточки статистики */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {statCards.map(card => (
              <Link
                key={card.key}
                href={card.key === 'issued_today' || card.key === 'active'
                  ? '/orders'
                  : `/orders?status=${card.key}`}
                className={`card p-4 border flex items-center gap-3 hover:shadow-md transition-shadow ${card.color}`}
              >
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <div className="text-2xl font-bold leading-none">
                    {data?.stats[card.key as keyof Stats] ?? 0}
                  </div>
                  <div className="text-xs mt-0.5 opacity-80">{card.label}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Быстрые действия */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href="/orders/new" className="btn-primary">
              + Новый заказ
            </Link>
            <Link href="/orders?status=ready" className="btn-secondary">
              📤 Готовые к выдаче ({data?.stats.ready ?? 0})
            </Link>
            <Link href="/clients" className="btn-secondary">
              👤 Клиенты
            </Link>
          </div>

          {/* Последние заказы */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Последние заказы</h2>
              <Link href="/orders" className="text-sm text-blue-600 hover:underline">Все заказы →</Link>
            </div>

            {/* Десктоп-таблица */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Номер</th>
                    <th className="text-left px-3 py-2.5 text-xs text-gray-400 font-medium">Клиент</th>
                    <th className="text-left px-3 py-2.5 text-xs text-gray-400 font-medium">Устройство</th>
                    <th className="text-left px-3 py-2.5 text-xs text-gray-400 font-medium">Статус</th>
                    <th className="text-left px-3 py-2.5 text-xs text-gray-400 font-medium">Обновлён</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_orders ?? []).map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/orders/${o.id}`} className="font-mono text-blue-600 hover:underline font-medium">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{o.client?.fullName}</td>
                      <td className="px-3 py-3 text-gray-500">{o.device?.brand} {o.device?.model}</td>
                      <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-3 py-3 text-gray-400 text-xs">{formatDate(o.updatedAt)}</td>
                    </tr>
                  ))}
                  {!(data?.recent_orders?.length) && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Заказов пока нет</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Мобильные карточки */}
            <div className="md:hidden divide-y divide-gray-100">
              {(data?.recent_orders ?? []).map(o => (
                <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium text-blue-600">{o.orderNumber}</div>
                    <div className="text-sm text-gray-700 truncate">{o.client?.fullName}</div>
                    <div className="text-xs text-gray-400">{o.device?.brand} {o.device?.model}</div>
                  </div>
                  <div className="flex-shrink-0"><StatusBadge status={o.status} /></div>
                </Link>
              ))}
              {!(data?.recent_orders?.length) && (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">Заказов пока нет</div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
