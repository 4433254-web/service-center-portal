'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi, clientsApi, devicesApi } from '@/lib/api';
import { STATUS_LABELS, DEVICE_TYPE_LABELS } from '@/lib/helpers';

interface SearchResults {
  orders: any[];
  clients: any[];
  devices: any[];
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ orders: [], clients: [], devices: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults({ orders: [], clients: [], devices: [] }); return; }
    setLoading(true);
    try {
      const [ordersRes, clientsRes, devicesRes] = await Promise.allSettled([
        ordersApi.list({ search: q, limit: '5' }),
        clientsApi.list({ search: q, limit: '5' }),
        devicesApi.list({ search: q, limit: '5' }),
      ]);
      setResults({
        orders: ordersRes.status === 'fulfilled' ? ordersRes.value.items : [],
        clients: clientsRes.status === 'fulfilled' ? clientsRes.value.items : [],
        devices: devicesRes.status === 'fulfilled' ? devicesRes.value.items : [],
      });
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length >= 2) {
      timerRef.current = setTimeout(() => search(query), 300);
    } else {
      setResults({ orders: [], clients: [], devices: [] });
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  const hasResults = results.orders.length + results.clients.length + results.devices.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск заказов, клиентов, устройств…"
          className="w-full pl-9 pr-16 py-2 text-sm bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hidden md:block">⌘K</span>
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">Поиск…</div>
          )}

          {!loading && !hasResults && (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">
              Ничего не найдено по «{query}»
            </div>
          )}

          {!loading && results.orders.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 border-b border-gray-100">
                Заказы
              </div>
              {results.orders.map(o => (
                <button key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-base">🔧</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono font-medium text-gray-900">{o.orderNumber}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {o.client?.fullName} · {STATUS_LABELS[o.status]}
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0">
                    {o.device?.brand} {o.device?.model}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading && results.clients.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 border-b border-gray-100">
                Клиенты
              </div>
              {results.clients.map(c => (
                <button key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-base">👤</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{c.fullName}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.devices.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 border-b border-gray-100">
                Устройства
              </div>
              {results.devices.map(d => (
                <button key={d.id} onClick={() => navigate(`/clients/${d.clientId}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-base">📱</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{d.brand} {d.model}</div>
                    <div className="text-xs text-gray-400">
                      {DEVICE_TYPE_LABELS[d.deviceType]}{d.imei ? ` · IMEI: ${d.imei}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
