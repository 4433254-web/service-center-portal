'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { clientsApi } from '@/lib/api';
import { formatDate, DEVICE_TYPE_LABELS } from '@/lib/helpers';

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
      setClient(c); setOrders(o); setDevices(d);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>;
  if (!client) return <AppLayout><Alert type="error" message={error || 'Клиент не найден'} /></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <div>
            <h1 className="page-title">{client.fullName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{client.phone}{client.email ? ` · ${client.email}` : ''}</p>
          </div>
          <Link href={`/orders/new`} className="btn-primary ml-auto btn-sm">+ Новый заказ</Link>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          {[['orders', `Заказы (${orders.length})`], ['devices', `Устройства (${devices.length})`]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr><th>Номер</th><th>Устройство</th><th>Статус</th><th>Дата</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><Link href={`/orders/${o.id}`} className="font-mono text-blue-600 hover:underline text-sm">{o.orderNumber}</Link></td>
                    <td className="text-sm text-gray-700">{o.device?.brand} {o.device?.model}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-xs text-gray-400">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">Нет заказов</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'devices' && (
          <div className="card">
            <table className="table">
              <thead>
                <tr><th>Устройство</th><th>Тип</th><th>IMEI</th><th>Добавлено</th></tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td className="text-sm font-medium text-gray-900">{d.brand} {d.model}</td>
                    <td className="text-sm text-gray-500">{DEVICE_TYPE_LABELS[d.deviceType]}</td>
                    <td className="text-xs font-mono text-gray-400">{d.imei || '—'}</td>
                    <td className="text-xs text-gray-400">{formatDate(d.createdAt)}</td>
                  </tr>
                ))}
                {!devices.length && <tr><td colSpan={4} className="text-center text-gray-400 py-8">Нет устройств</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
