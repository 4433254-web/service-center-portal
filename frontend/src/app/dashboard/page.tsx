'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { dashboardApi } from '@/lib/api';
import { formatDate } from '@/lib/helpers';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-5">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">Загрузка дашборда…</div>
    </AppLayout>
  );

  const s = data?.stats ?? {};

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Дашборд</h1>
        <Link href="/orders/new" className="btn-primary">+ Новый заказ</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Активных заказов" value={s.activeOrders ?? 0} color="text-blue-600" />
        <StatCard label="Принято" value={s.accepted ?? 0} color="text-blue-500" />
        <StatCard label="В работе" value={s.inProgress ?? 0} color="text-purple-600" />
        <StatCard label="Готово к выдаче" value={s.ready ?? 0} color="text-green-600" />
        <StatCard label="На диагностике" value={s.inDiagnostics ?? 0} color="text-yellow-600" />
        <StatCard label="Ожид. согласования" value={s.waitingApproval ?? 0} color="text-orange-600" />
        <StatCard label="Выдано сегодня" value={s.issuedToday ?? 0} color="text-teal-600" />
        <StatCard label="Всего заказов" value={s.total ?? 0} color="text-gray-600" />
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Последние заказы</h2>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">Все заказы →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Клиент</th>
                <th>Устройство</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders ?? []).map((o: any) => (
                <tr key={o.id} className="cursor-pointer">
                  <td>
                    <Link href={`/orders/${o.id}`} className="font-mono text-blue-600 hover:underline text-sm">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-gray-900">{o.client?.fullName}</div>
                    <div className="text-xs text-gray-400">{o.client?.phone}</div>
                  </td>
                  <td className="text-sm text-gray-700">{o.device?.brand} {o.device?.model}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-xs text-gray-500">{formatDate(o.updatedAt)}</td>
                </tr>
              ))}
              {!(data?.recentOrders?.length) && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">Заказов пока нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
