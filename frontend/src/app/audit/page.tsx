'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/helpers';

const ACTION_LABELS: Record<string, string> = {
  create: '➕ Создание',
  update: '✏️ Изменение',
  delete: '🗑 Удаление',
  status_change: '🔄 Смена статуса',
  login: '🔐 Вход',
  logout: '🚪 Выход',
  issue: '📤 Выдача',
};

const ENTITY_LABELS: Record<string, string> = {
  order: 'Заказ',
  client: 'Клиент',
  device: 'Устройство',
  user: 'Пользователь',
  repair_order: 'Заказ',
};

export default function AuditPage() {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 50;

  async function load(p = page, q = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q) params.set('search', q);
      const res = await api.get<any>(`/audit?${params}`);
      if (Array.isArray(res)) {
        setLogs(res);
        setTotal(res.length);
      } else {
        setLogs(res.items ?? []);
        setTotal(res.total ?? 0);
      }
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page]);

  if (!hasRole('admin')) {
    return <AppLayout><Alert type="error" message="Нет доступа к журналу аудита" /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Журнал аудита</h1>
        <span className="text-sm text-gray-400">Всего записей: {total}</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input className="input flex-1" placeholder="Поиск по пользователю, действию…"
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(1, search); } }} />
        <button className="btn-primary" onClick={() => { setPage(1); load(1, search); }}>Найти</button>
        {search && <button className="btn-secondary" onClick={() => { setSearch(''); setPage(1); load(1, ''); }}>Сбросить</button>}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Десктоп */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Пользователь</th>
                    <th>Действие</th>
                    <th>Объект</th>
                    <th>Детали</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="text-xs text-gray-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="text-sm font-medium text-gray-700">{log.user?.login ?? '—'}</td>
                      <td className="text-sm">{ACTION_LABELS[log.actionType] ?? log.actionType}</td>
                      <td className="text-sm text-gray-500">
                        {ENTITY_LABELS[log.entityType] ?? log.entityType}
                        {log.entityId && <span className="text-xs text-gray-300 ml-1 font-mono">#{log.entityId.slice(0, 8)}</span>}
                      </td>
                      <td className="text-xs text-gray-400 max-w-xs truncate">
                        {log.newValue ? JSON.stringify(log.newValue).slice(0, 80) : '—'}
                      </td>
                    </tr>
                  ))}
                  {!logs.length && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-10">Записей нет</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Мобиль */}
            <div className="md:hidden divide-y divide-gray-100">
              {logs.map(log => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-800">{log.user?.login ?? '—'}</span>
                    <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                  </div>
                  <div className="text-sm text-gray-600">{ACTION_LABELS[log.actionType] ?? log.actionType}</div>
                  <div className="text-xs text-gray-400">
                    {ENTITY_LABELS[log.entityType] ?? log.entityType}
                    {log.entityId && ` · ${log.entityId.slice(0, 8)}`}
                  </div>
                </div>
              ))}
              {!logs.length && <div className="py-10 text-center text-gray-400 text-sm">Записей нет</div>}
            </div>

            {/* Пагинация */}
            {total > limit && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm">← Назад</button>
                <span>Стр. {page} из {Math.ceil(total / limit)}</span>
                <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm">Вперёд →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
