'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { clientsApi } from '@/lib/api';
import { formatDate, DEVICE_TYPE_LABELS, STATUS_COLORS } from '@/lib/helpers';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'orders' | 'devices'>('orders');

  useEffect(() => {
    Promise.all([
      clientsApi.get(id),
      clientsApi.orders(id),
      clientsApi.devices(id),
    ]).then(([c, o, d]) => {
      setClient(c);
      setOrders(Array.isArray(o) ? o : []);
      setDevices(Array.isArray(d) ? d : []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>;
  if (!client) return <AppLayout><Alert type="error" message={error || 'Клиент не найден'} /></AppLayout>;

  const activeOrders = orders.filter(o => !['issued', 'cancelled'].includes(o.status));

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Шапка */}
        <div className="flex items-start gap-3 mb-6 flex-wrap">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl mt-1">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{client.fullName}</h1>
            <div className="flex flex-wrap gap-3 mt-1">
              <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:underline">📞 {client.phone}</a>
              {client.phoneExtra && <a href={`tel:${client.phoneExtra}`} className="text-sm text-blue-600 hover:underline">📞 {client.phoneExtra}</a>}
              {client.email && <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline">✉️ {client.email}</a>}
            </div>
          </div>
          <Link href="/orders/new" className="btn-primary btn-sm flex-shrink-0">+ Новый заказ</Link>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">Всего заказов</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{activeOrders.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">Активных</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{devices.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">Устройств</div>
          </div>
        </div>

        {client.comment && (
          <div className="card p-3 mb-4 bg-yellow-50 border-yellow-200 text-sm text-yellow-800">
            💬 {client.comment}
          </div>
        )}

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {/* Табы */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          {([['orders', `Заказы (${orders.length})`], ['devices', `Устройства (${devices.length})`]] as const).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Заказы */}
        {tab === 'orders' && (
          <>
            {/* Десктоп */}
            <div className="card hidden md:block overflow-hidden">
              <table className="table">
                <thead>
                  <tr><th>Номер</th><th>Устройство</th><th>Неисправность</th><th>Статус</th><th>Дата</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/orders/${o.id}`} className="font-mono text-blue-600 hover:underline text-sm font-medium">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="text-sm text-gray-700">{o.device?.brand} {o.device?.model}</td>
                      <td className="text-sm text-gray-500 max-w-[180px] truncate">{o.issueDescription}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-xs text-gray-400 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                  {!orders.length && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-10">Нет заказов</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Мобиль */}
            <div className="md:hidden space-y-2">
              {orders.map(o => (
                <Link key={o.id} href={`/orders/${o.id}`} className="card p-4 block hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-bold text-blue-600">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-sm font-medium text-gray-800">{o.device?.brand} {o.device?.model}</div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{o.issueDescription}</div>
                  <div className="text-xs text-gray-300 mt-1">{formatDate(o.createdAt)}</div>
                </Link>
              ))}
              {!orders.length && <div className="text-center text-gray-400 py-10 text-sm">Нет заказов</div>}
            </div>
          </>
        )}

        {/* Устройства */}
        {tab === 'devices' && (
          <div className="space-y-3">
            {devices.map(d => {
              const deviceOrders = orders.filter(o => o.deviceId === d.id);
              return (
                <div key={d.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{d.brand} {d.model}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {DEVICE_TYPE_LABELS[d.deviceType]}
                        {d.color ? ` · ${d.color}` : ''}
                        {d.imei ? ` · IMEI: ${d.imei}` : ''}
                        {d.serialNumber ? ` · S/N: ${d.serialNumber}` : ''}
                      </div>
                    </div>
                    <span className="text-xs text-gray-300">{formatDate(d.createdAt)}</span>
                  </div>
                  {deviceOrders.length > 0 && (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <div className="text-xs text-gray-400 mb-1.5">История ремонтов ({deviceOrders.length}):</div>
                      <div className="space-y-1">
                        {deviceOrders.slice(0, 5).map(o => (
                          <Link key={o.id} href={`/orders/${o.id}`}
                            className="flex items-center justify-between py-1 hover:bg-gray-50 rounded px-1 transition-colors">
                            <span className="font-mono text-xs text-blue-600">{o.orderNumber}</span>
                            <span className="text-xs text-gray-400 truncate mx-2 flex-1">{o.issueDescription}</span>
                            <StatusBadge status={o.status} />
                          </Link>
                        ))}
                        {deviceOrders.length > 5 && (
                          <div className="text-xs text-gray-400 text-center pt-1">
                            ещё {deviceOrders.length - 5} заказов…
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!deviceOrders.length && (
                    <div className="text-xs text-gray-300 mt-2 border-t border-gray-100 pt-2">Ремонтов не было</div>
                  )}
                </div>
              );
            })}
            {!devices.length && <div className="text-center text-gray-400 py-10 text-sm">Нет устройств</div>}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
