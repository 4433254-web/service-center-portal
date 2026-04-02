'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import { clientsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDateShort } from '@/lib/helpers';

export default function ClientsPage() {
  const { hasRole } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', comment: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await clientsApi.list(params);
      setClients(res.items);
      setTotal(res.total);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await clientsApi.create(form);
      setShowModal(false);
      setForm({ fullName: '', phone: '', email: '', comment: '' });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Клиенты</h1>
        {hasRole('receiver') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Новый клиент</button>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="card p-4 mb-4">
        <div className="flex gap-3">
          <input className="input flex-1" placeholder="Поиск по имени или телефону…" value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary">Найти</button>
          {search && <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setPage(1); }}>Сбросить</button>}
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
                    <th>Клиент</th>
                    <th>Телефон</th>
                    <th>Email</th>
                    <th>Зарегистрирован</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/clients/${c.id}`} className="font-medium text-blue-600 hover:underline text-sm">{c.fullName}</Link>
                      </td>
                      <td className="text-sm text-gray-700">{c.phone}</td>
                      <td className="text-sm text-gray-500">{c.email || '—'}</td>
                      <td className="text-xs text-gray-400">{formatDateShort(c.createdAt)}</td>
                      <td>
                        <Link href={`/orders?search=${encodeURIComponent(c.phone)}`} className="text-xs text-blue-500 hover:underline">заказы →</Link>
                      </td>
                    </tr>
                  ))}
                  {!clients.length && <tr><td colSpan={5} className="text-center text-gray-400 py-12">Клиенты не найдены</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </>
        )}
      </div>

      {showModal && (
        <Modal title="Новый клиент" onClose={() => setShowModal(false)}>
          {error && <div className="mb-3"><Alert type="error" message={error} /></div>}
          <form onSubmit={handleCreate} className="space-y-3">
            <div><label className="label">ФИО *</label><input className="input" required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Иванов Иван" /></div>
            <div><label className="label">Телефон *</label><input className="input" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+79991234567" /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">Комментарий</label><textarea className="input" rows={2} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Сохранение…' : 'Создать'}</button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
