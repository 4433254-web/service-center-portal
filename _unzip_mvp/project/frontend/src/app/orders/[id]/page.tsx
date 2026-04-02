'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/Layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, STATUS_LABELS, STATUS_TRANSITIONS, DEVICE_TYPE_LABELS } from '@/lib/helpers';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [statusComment, setStatusComment] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    try {
      const o = await ordersApi.get(id);
      setOrder(o);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatusChange(toStatus: string) {
    setChangingStatus(true);
    setError('');
    try {
      await ordersApi.changeStatus(id, toStatus, statusComment);
      setSuccess(`Статус изменён на: ${STATUS_LABELS[toStatus]}`);
      setShowStatusModal(false);
      setStatusComment('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleAddComment() {
    if (!comment.trim()) return;
    setAddingComment(true);
    try {
      await ordersApi.addComment(id, comment);
      setComment('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingComment(false);
    }
  }

  async function handleGenerateReceipt() {
    setGeneratingPdf(true);
    setError('');
    try {
      const doc = await ordersApi.generateReceipt(id);
      setSuccess('Квитанция сформирована');
      window.open(`/api/documents/${doc.id}/download`, '_blank');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingPdf(false);
    }
  }

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>;
  if (!order) return <AppLayout><Alert type="error" message={error || 'Заказ не найден'} /></AppLayout>;

  const nextStatuses = STATUS_TRANSITIONS[order.status] ?? [];
  const canChangeStatus = hasRole('admin') || hasRole('receiver') || hasRole('master');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Шапка */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
            <div>
              <h1 className="text-xl font-bold font-mono text-gray-900">{order.orderNumber}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={order.status} />
                <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleGenerateReceipt} disabled={generatingPdf} className="btn-secondary btn-sm">
              {generatingPdf ? 'Формируем…' : '🖨 Квитанция'}
            </button>
            {canChangeStatus && nextStatuses.length > 0 && (
              <div className="relative">
                <select
                  className="btn-primary btn-sm cursor-pointer appearance-none pr-6"
                  value=""
                  onChange={e => { if (e.target.value) { setTargetStatus(e.target.value); setShowStatusModal(true); } }}
                >
                  <option value="">Изменить статус ▾</option>
                  {nextStatuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
        {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

        {/* Модал смены статуса */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowStatusModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Изменить статус на «{STATUS_LABELS[targetStatus]}»?</h3>
              <label className="label">Комментарий (необязательно)</label>
              <textarea className="input mb-4" rows={3} value={statusComment} onChange={e => setStatusComment(e.target.value)} placeholder="Введите комментарий…" />
              <div className="flex gap-3">
                <button onClick={() => setShowStatusModal(false)} className="btn-secondary flex-1 justify-center">Отмена</button>
                <button onClick={() => handleStatusChange(targetStatus)} disabled={changingStatus} className="btn-primary flex-1 justify-center">
                  {changingStatus ? 'Сохранение…' : 'Подтвердить'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Левая колонка */}
          <div className="lg:col-span-2 space-y-4">
            {/* Клиент */}
            <div className="card p-5">
              <h2 className="section-title text-base font-semibold text-gray-700 mb-3">👤 Клиент</h2>
              {order.client && (
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-400">ФИО: </span><Link href={`/clients/${order.client.id}`} className="font-medium text-blue-600 hover:underline">{order.client.fullName}</Link></div>
                  <div><span className="text-gray-400">Телефон: </span><span className="font-medium">{order.client.phone}</span></div>
                  {order.client.email && <div><span className="text-gray-400">Email: </span>{order.client.email}</div>}
                </div>
              )}
            </div>

            {/* Устройство */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-3">📱 Устройство</h2>
              {order.device && (
                <div className="space-y-1 text-sm">
                  <div><span className="text-gray-400">Тип: </span>{DEVICE_TYPE_LABELS[order.device.deviceType]}</div>
                  <div><span className="text-gray-400">Модель: </span><span className="font-medium">{order.device.brand} {order.device.model}</span></div>
                  {order.device.imei && <div><span className="text-gray-400">IMEI: </span><span className="font-mono">{order.device.imei}</span></div>}
                  {order.device.color && <div><span className="text-gray-400">Цвет: </span>{order.device.color}</div>}
                </div>
              )}
            </div>

            {/* Описание заказа */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-3">🔧 Описание</h2>
              <div className="space-y-3 text-sm">
                <div><span className="text-gray-400 block text-xs mb-0.5">Неисправность</span><p className="text-gray-900">{order.issueDescription}</p></div>
                <div><span className="text-gray-400 block text-xs mb-0.5">Состояние при приёме</span><p className="text-gray-900">{order.conditionAtAcceptance}</p></div>
                {order.includedItems && <div><span className="text-gray-400 block text-xs mb-0.5">Комплектация</span><p className="text-gray-900">{order.includedItems}</p></div>}
                {order.receiverComment && <div><span className="text-gray-400 block text-xs mb-0.5">Комментарий приёмщика</span><p className="text-gray-900">{order.receiverComment}</p></div>}
              </div>
            </div>

            {/* Комментарии */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-3">💬 Комментарии</h2>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {(order.comments ?? []).map((c: any) => (
                  <div key={c.id} className={`p-3 rounded-lg text-sm ${c.isInternal ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-700">{c.user?.login}</span>
                      {c.isInternal && <span className="badge bg-yellow-100 text-yellow-700 text-xs">внутренний</span>}
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-gray-700">{c.commentText}</p>
                  </div>
                ))}
                {!(order.comments?.length) && <p className="text-gray-400 text-sm">Нет комментариев</p>}
              </div>
              {canChangeStatus && (
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Добавить комментарий…" value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }} />
                  <button onClick={handleAddComment} disabled={addingComment || !comment.trim()} className="btn-primary btn-sm">Отправить</button>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-4">
            {/* Детали */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-3">📋 Детали</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Приёмщик</span><span>{order.receiverUser?.login}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Мастер</span><span>{order.masterUser?.login ?? '—'}</span></div>
                {order.estimatedPrice && <div className="flex justify-between"><span className="text-gray-400">Стоимость</span><span className="font-medium">{Number(order.estimatedPrice).toLocaleString('ru-RU')} ₽</span></div>}
                {order.estimatedReadyAt && <div className="flex justify-between"><span className="text-gray-400">Срок</span><span>{formatDate(order.estimatedReadyAt)}</span></div>}
                {order.issuedAt && <div className="flex justify-between"><span className="text-gray-400">Выдан</span><span>{formatDate(order.issuedAt)}</span></div>}
              </div>
            </div>

            {/* История статусов */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-3">📅 История</h2>
              <div className="space-y-3">
                {(order.statusHistory ?? []).map((h: any) => (
                  <div key={h.id} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="text-xs font-medium text-gray-700"><StatusBadge status={h.toStatus} /></div>
                      <div className="text-xs text-gray-400 mt-0.5">{h.user?.login} · {formatDate(h.createdAt)}</div>
                      {h.comment && <div className="text-xs text-gray-500 mt-0.5 italic">{h.comment}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Документы */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-3">📄 Документы</h2>
              {(order.documents ?? []).map((d: any) => (
                <a key={d.id} href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-blue-600 hover:underline">
                  📄 Квитанция · {formatDate(d.createdAt)}
                </a>
              ))}
              {!(order.documents?.length) && <p className="text-gray-400 text-sm">Нет документов</p>}
              <button onClick={handleGenerateReceipt} disabled={generatingPdf} className="btn-secondary w-full justify-center mt-3 btn-sm">
                {generatingPdf ? 'Формируем…' : '+ Сформировать квитанцию'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
