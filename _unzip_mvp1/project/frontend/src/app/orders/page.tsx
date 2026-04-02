'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import { ordersApi } from '@/lib/api';
import { formatDate, STATUS_LABELS } from '@/lib/helpers';

const STATUSES = ['', 'accepted', 'in_diagnostics', 'waiting_approval', 'in_progress', 'ready', 'issued', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await ordersApi.list(params);
      setOrders(res.items);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(1); load(); }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Заказы</h1>
        <Link href="/orders/new" className="btn-primary">+ Новый заказ</Link>
      </div>

      {/* Фильтры */}
      <form onSubmit={handleSearch} className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-[200px]"
            placeholder="Поиск по номеру, клиенту, устройству, IMEI…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input w-48" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s ? STATUS_LABELS[s] : 'Все статусы'}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Найти</button>
          {(search || status) && (
            <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>
              Сбросить
            </button>
          )}
        </div>
      </form>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Клиент</th>
                    <th>Устройство</th>
                    <th>Статус</th>
                    <th>Мастер</th>
                    <th>Дата приёма</th>
                    <th>Стоимость</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/orders/${o.id}`} className="font-mono text-blue-600 hover:underline text-sm font-medium">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-gray-900">{o.client?.fullName}</div>
                        <div className="text-xs text-gray-400">{o.client?.phone}</div>
                      </td>
                      <td className="text-sm text-gray-700">
                        <div>{o.device?.brand} {o.device?.model}</div>
                      </td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-sm text-gray-500">{o.masterUser?.login ?? '—'}</td>
                      <td className="text-xs text-gray-500">{formatDate(o.createdAt)}</td>
                      <td className="text-sm text-gray-700">
                        {o.estimatedPrice ? `${Number(o.estimatedPrice).toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                    </tr>
                  ))}
                  {!orders.length && (
                    <tr><td colSpan={7} className="text-center text-gray-400 py-12">Заказы не найдены</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
