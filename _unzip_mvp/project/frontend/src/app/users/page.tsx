'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDateShort, ROLE_LABELS } from '@/lib/helpers';

const ALL_ROLES = ['admin', 'receiver', 'master', 'manager'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ login: '', password: '', roles: ['receiver'] as string[], isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() { setLoading(true); try { setUsers(await usersApi.list()); } catch {} finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditUser(null); setForm({ login:'', password:'', roles:['receiver'], isActive:true }); setError(''); setShowModal(true); }
  function openEdit(u: any) { setEditUser(u); setForm({ login:u.login, password:'', roles:u.roles??[], isActive:u.isActive }); setError(''); setShowModal(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editUser) { await usersApi.update(editUser.id, { isActive:form.isActive, roles:form.roles }); if(form.password) await usersApi.resetPassword(editUser.id, form.password); setSuccess('Обновлено'); }
      else { await usersApi.create({ login:form.login, password:form.password, roles:form.roles, isActive:form.isActive }); setSuccess('Создан'); }
      setShowModal(false); await load();
    } catch(err:any) { setError(err.message); } finally { setSaving(false); }
  }
  function toggleRole(role: string) { setForm(f => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter(r=>r!==role) : [...f.roles, role] })); }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Пользователи</h1>
        <button onClick={openCreate} className="btn-primary">+ Новый пользователь</button>
      </div>
      {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
      <div className="card">
        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
          <table className="table">
            <thead><tr><th>Логин</th><th>Роли</th><th>Статус</th><th>Создан</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><div className="text-sm font-medium">{u.login}</div>{u.id===currentUser?.id&&<span className="text-xs text-blue-500">вы</span>}</td>
                  <td><div className="flex flex-wrap gap-1">{(u.roles??[]).map((r:string)=><span key={r} className="badge bg-gray-100 text-gray-700 text-xs">{ROLE_LABELS[r]??r}</span>)}</div></td>
                  <td><span className={`badge ${u.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{u.isActive?'Активен':'Заблокирован'}</span></td>
                  <td className="text-xs text-gray-400">{formatDateShort(u.createdAt)}</td>
                  <td><button onClick={() => openEdit(u)} className="text-sm text-blue-600 hover:underline">Изменить</button></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={5} className="text-center text-gray-400 py-12">Нет пользователей</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <Modal title={editUser?`Редактировать: ${editUser.login}`:'Новый пользователь'} onClose={()=>setShowModal(false)}>
          {error && <div className="mb-3"><Alert type="error" message={error} /></div>}
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="label">Логин *</label><input className="input" value={form.login} onChange={e=>setForm(f=>({...f,login:e.target.value}))} required disabled={!!editUser} placeholder="user123" /></div>
            <div><label className="label">{editUser?'Новый пароль (пусто = не менять)':'Пароль *'}</label><input className="input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required={!editUser} minLength={6} /></div>
            <div><label className="label">Роли</label>
              <div className="flex flex-wrap gap-2 mt-1">{ALL_ROLES.map(role=><button key={role} type="button" onClick={()=>toggleRole(role)} className={`badge cursor-pointer text-xs ${form.roles.includes(role)?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{ROLE_LABELS[role]}</button>)}</div>
            </div>
            <div className="flex items-center gap-2"><input id="active" type="checkbox" checked={form.isActive} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} /><label htmlFor="active" className="text-sm text-gray-700">Активен</label></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Сохранение…':'Сохранить'}</button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
