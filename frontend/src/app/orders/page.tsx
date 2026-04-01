'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
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
  const [qrOrder, setQrOrder] = useState<any>(null);

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

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Заказы</h1>
        <Link href="/orders/new" className="btn-primary">+ Новый заказ</Link>
      </div>

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
            <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Сбросить</button>
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
                    <th>QR</th>
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
                      <td className="w-10">
                        <button
                          onClick={() => setQrOrder(qrOrder?.id === o.id ? null : o)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Показать QR-код"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </button>
                      </td>
                      <td>
                        <Link href={`/orders/${o.id}`} className="font-mono text-blue-600 hover:underline text-sm font-medium">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-gray-900">{o.client?.fullName}</div>
                        <div className="text-xs text-gray-400">{o.client?.phone}</div>
                      </td>
                      <td className="text-sm text-gray-700">{o.device?.brand} {o.device?.model}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-sm text-gray-500">{o.masterUser?.login ?? '—'}</td>
                      <td className="text-xs text-gray-500">{formatDate(o.createdAt)}</td>
                      <td className="text-sm text-gray-700">
                        {o.estimatedPrice ? `${Number(o.estimatedPrice).toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                    </tr>
                  ))}
                  {!orders.length && (
                    <tr><td colSpan={8} className="text-center text-gray-400 py-12">Заказы не найдены</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </>
        )}
      </div>

      {/* QR попап */}
      {qrOrder && origin && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" onClick={() => setQrOrder(null)}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrOrder(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            <h3 className="font-bold text-gray-900 text-base">QR-код заказа</h3>
            <div className="font-mono text-sm font-semibold text-blue-700">{qrOrder.orderNumber}</div>
            <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-inner">
              <QRCode
                value={`${origin}/orders/${qrOrder.id}`}
                size={180}
                fgColor="#1e3a5f"
                bgColor="#ffffff"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">{qrOrder.client?.fullName}</p>
              <p className="text-xs text-gray-400">{qrOrder.device?.brand} {qrOrder.device?.model}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(`${origin}/orders/${qrOrder.id}`); }}
              className="btn-secondary btn-sm w-full justify-center"
            >
              🔗 Скопировать ссылку
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
