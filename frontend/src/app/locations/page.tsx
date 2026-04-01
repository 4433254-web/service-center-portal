'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { locationsApi, usersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS } from '@/lib/helpers';

export default function LocationsPage() {
  const { hasRole } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUsers, setShowUsers] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addUserId, setAddUserId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [locs, users] = await Promise.all([locationsApi.list(), usersApi.list()]);
      setLocations(locs);
      setAllUsers(users);
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await locationsApi.create(form);
      setShowCreate(false);
      setForm({ name: '', address: '', phone: '', email: '' });
      setSuccess('Точка создана');
      await load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleAddUser() {
    if (!addUserId || !showUsers) return;
    try {
      await locationsApi.addUser(showUsers.id, addUserId);
      setAddUserId('');
      setSuccess('Сотрудник добавлен');
      await load();
      setShowUsers(locations.find(l => l.id === showUsers.id) ?? showUsers);
    } catch (err: any) { setError(err.message); }
  }

  async function handleRemoveUser(locationId: string, userId: string) {
    if (!confirm('Удалить сотрудника из точки?')) return;
    try {
      await locationsApi.removeUser(locationId, userId);
      await load();
      setShowUsers((prev: any) => prev ? { ...prev, users: prev.users?.filter((u: any) => u.user?.id !== userId) } : prev);
    } catch (err: any) { alert(err.message); }
  }

  if (!hasRole('admin') && !hasRole('manager')) {
    return <AppLayout><Alert type="error" message="Нет доступа" /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Точки / Сервисы</h1>
        {hasRole('admin') && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ Новая точка</button>
        )}
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map(loc => (
            <div key={loc.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                  {loc.address && <p className="text-sm text-gray-500 mt-0.5">📍 {loc.address}</p>}
                  {loc.phone && <p className="text-sm text-gray-500">📞 {loc.phone}</p>}
                </div>
                <span className={`badge text-xs ${loc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {loc.isActive ? 'Активна' : 'Неактивна'}
                </span>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Сотрудники ({loc.users?.length ?? 0}):</div>
                <div className="flex flex-wrap gap-1">
                  {(loc.users ?? []).slice(0, 5).map((ul: any) => (
                    <span key={ul.user?.id} className="badge bg-blue-50 text-blue-700 text-xs">
                      {ul.user?.login}
                    </span>
                  ))}
                  {(loc.users?.length ?? 0) > 5 && <span className="badge bg-gray-100 text-gray-500 text-xs">+{loc.users.length - 5}</span>}
                  {!loc.users?.length && <span className="text-xs text-gray-400">не назначены</span>}
                </div>
              </div>
              <button onClick={() => setShowUsers(loc)} className="btn-secondary btn-sm w-full justify-center">
                ⚙ Управление сотрудниками
              </button>
            </div>
          ))}
          {!locations.length && (
            <div className="col-span-2 text-center text-gray-400 py-12">
              Точек нет. {hasRole('admin') && 'Создайте первую точку приёма.'}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal title="Новая точка / сервис" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div><label className="label">Название *</label><input className="input" required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Сервисный центр на Ленина" /></div>
            <div><label className="label">Адрес</label><input className="input" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} placeholder="ул. Ленина, 1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Телефон</label><input className="input" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Сохранение…' : 'Создать'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showUsers && (
        <Modal title={`Сотрудники: ${showUsers.name}`} onClose={() => setShowUsers(null)}>
          <div className="space-y-3">
            <div>
              <label className="label">Добавить сотрудника</label>
              <div className="flex gap-2">
                <select className="input flex-1" value={addUserId} onChange={e => setAddUserId(e.target.value)}>
                  <option value="">— выбрать —</option>
                  {allUsers.filter(u => !showUsers.users?.some((ul: any) => ul.user?.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.login} ({(u.roles||[]).join(', ')})</option>
                  ))}
                </select>
                <button onClick={handleAddUser} disabled={!addUserId} className="btn-primary btn-sm">Добавить</button>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="text-sm text-gray-600 mb-2">Текущие сотрудники:</div>
              {(showUsers.users ?? []).map((ul: any) => (
                <div key={ul.user?.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium">{ul.user?.login}</span>
                    <span className="text-xs text-gray-400 ml-2">{(ul.user?.roles||[]).map((r: any) => ROLE_LABELS[r?.role?.name ?? r] ?? r?.role?.name ?? r).join(', ')}</span>
                  </div>
                  <button onClick={() => handleRemoveUser(showUsers.id, ul.user?.id)} className="text-xs text-red-500 hover:text-red-700">удалить</button>
                </div>
              ))}
              {!showUsers.users?.length && <p className="text-sm text-gray-400">Нет сотрудников</p>}
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
