'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import AppLayout from '@/components/Layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import { ordersApi } from '@/lib/api';
import { formatDate, STATUS_LABELS } from '@/lib/helpers';

const STATUSES = ['', 'accepted', 'in_diagnostics', 'waiting_approval', 'in_progress', 'ready', 'issued', 'cancelled'];
const STATUS_ICONS: Record<string, string> = {
  accepted: '📥', in_diagnostics: '🔬', waiting_approval: '⏳',
  in_progress: '🔧', ready: '✅', issued: '📤', cancelled: '❌',
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams?.get('status') ?? '');
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
    } catch { } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Заказы <span className="text-base font-normal text-gray-400">({total})</span></h1>
        <Link href="/orders/new" className="btn-primary">+ Новый</Link>
      </div>

      {/* Строка поиска */}
      <div className="flex gap-2 mb-3">
        <input
          className="input flex-1"
          placeholder="Поиск по номеру, клиенту, IMEI…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        {(search || status) && (
          <button className="btn-secondary" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>
            Сбросить
          </button>
        )}
      </div>

      {/* Фильтр статусов — пилюли */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              status === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {s ? `${STATUS_ICONS[s] ?? ''} ${STATUS_LABELS[s]}` : 'Все'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Десктоп таблица */}
          <div className="card hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-8"></th>
                    <th>Номер</th>
                    <th>Клиент</th>
                    <th>Устройство</th>
                    <th>Статус</th>
                    <th>Мастер</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <button onClick={() => setQrOrder(qrOrder?.id === o.id ? null : o)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{o.client?.fullName}</div>
                        <div className="text-xs text-gray-400">{o.client?.phone}</div>
                      </td>
                      <td className="text-sm text-gray-600 truncate max-w-[120px]">{o.device?.brand} {o.device?.model}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-sm text-gray-500">{o.masterUser?.login ?? '—'}</td>
                      <td className="text-xs text-gray-400 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                      <td className="text-sm text-gray-700 whitespace-nowrap">
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
          </div>

          {/* Мобильные карточки */}
          <div className="md:hidden space-y-2">
            {orders.map(o => (
              <Link key={o.id} href={`/orders/${o.id}`}
                className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow block">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-blue-600">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">{o.client?.fullName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {o.device?.brand} {o.device?.model}
                    {o.masterUser ? ` · ${o.masterUser.login}` : ''}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">{formatDate(o.createdAt)}</div>
                </div>
                {o.estimatedPrice && (
                  <div className="text-sm font-medium text-gray-700 flex-shrink-0">
                    {Number(o.estimatedPrice).toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </Link>
            ))}
            {!orders.length && (
              <div className="text-center text-gray-400 py-12 text-sm">Заказы не найдены</div>
            )}
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </div>
        </>
      )}

      {/* QR попап */}
      {qrOrder && origin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setQrOrder(null)}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrOrder(null)} className="absolute top-3 right-3 text-gray-400 text-xl">×</button>
            <div className="font-mono text-sm font-bold text-blue-700">{qrOrder.orderNumber}</div>
            <QRCode value={`${origin}/orders/${qrOrder.id}`} size={180} fgColor="#1e3a5f" />
            <p className="text-xs text-gray-400 text-center">{qrOrder.client?.fullName} · {qrOrder.device?.brand} {qrOrder.device?.model}</p>
            <button onClick={() => navigator.clipboard.writeText(`${origin}/orders/${qrOrder.id}`)}
              className="btn-secondary btn-sm w-full justify-center">🔗 Копировать ссылку</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
