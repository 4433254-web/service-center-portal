'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Part {
  id: string; name: string; quantity: number; price: number; note?: string;
  user?: { login: string };
}

interface Props {
  orderId: string;
  order: any;
  onUpdate: () => void;
}

export default function OrderPricing({ orderId, order, onUpdate }: Props) {
  const { hasRole } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [partsTotal, setPartsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editPrices, setEditPrices] = useState(false);
  const [newPart, setNewPart] = useState({ name: '', quantity: '1', price: '', note: '' });
  const [prices, setPrices] = useState({ laborCost: '', finalPrice: '' });

  const canEdit = hasRole('admin') || hasRole('receiver') || hasRole('master');

  async function loadParts() {
    try {
      const res = await api.get<any>(`/orders/${orderId}/parts`);
      setParts(res.parts ?? []);
      setPartsTotal(res.total ?? 0);
    } catch { } finally { setLoading(false); }
  }

  useEffect(() => {
    loadParts();
    setPrices({
      laborCost:  order.laborCost  ? String(Number(order.laborCost))  : '',
      finalPrice: order.finalPrice ? String(Number(order.finalPrice)) : '',
    });
  }, [orderId, order]);

  async function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    if (!newPart.name || !newPart.price) return;
    setSaving(true);
    try {
      await api.post(`/orders/${orderId}/parts`, {
        name: newPart.name,
        quantity: Number(newPart.quantity) || 1,
        price: Number(newPart.price),
        note: newPart.note || undefined,
      });
      setNewPart({ name: '', quantity: '1', price: '', note: '' });
      setShowAdd(false);
      await loadParts();
      onUpdate();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDeletePart(partId: string) {
    if (!confirm('Удалить запчасть?')) return;
    try {
      await api.del(`/orders/${orderId}/parts/${partId}`);
      await loadParts(); onUpdate();
    } catch (err: any) { alert(err.message); }
  }

  async function handleSavePrices(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api.patch(`/orders/${orderId}/price`, {
        laborCost:  prices.laborCost  ? Number(prices.laborCost)  : undefined,
        finalPrice: prices.finalPrice ? Number(prices.finalPrice) : undefined,
      });
      setEditPrices(false); onUpdate();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  const laborCost  = Number(order.laborCost  ?? 0);
  const finalPrice = Number(order.finalPrice ?? 0);
  const autoTotal  = partsTotal + laborCost;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700">💰 Стоимость ремонта</h2>
        {canEdit && !editPrices && (
          <button onClick={() => setEditPrices(true)} className="text-xs text-blue-600 hover:underline">✏️ Изменить</button>
        )}
      </div>

      {/* Сводка цен */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Предв. оценка</span>
          <span>{order.estimatedPrice ? `${Number(order.estimatedPrice).toLocaleString('ru-RU')} ₽` : '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Запчасти ({parts.length})</span>
          <span className="font-medium">{partsTotal.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Работы</span>
          <span className="font-medium">{laborCost ? `${laborCost.toLocaleString('ru-RU')} ₽` : '—'}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
          <span className="text-gray-700">К оплате</span>
          <span className={`text-lg ${finalPrice ? 'text-blue-700' : 'text-gray-400'}`}>
            {finalPrice
              ? `${finalPrice.toLocaleString('ru-RU')} ₽`
              : autoTotal > 0 ? `~${autoTotal.toLocaleString('ru-RU')} ₽` : '—'}
          </span>
        </div>
      </div>

      {/* Форма редактирования цен */}
      {editPrices && (
        <form onSubmit={handleSavePrices} className="bg-blue-50 rounded-lg p-3 border border-blue-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Стоимость работ, ₽</label>
              <input className="input" type="number" min="0" value={prices.laborCost}
                onChange={e => setPrices(p => ({ ...p, laborCost: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Итог к оплате, ₽</label>
              <input className="input" type="number" min="0" value={prices.finalPrice}
                onChange={e => setPrices(p => ({ ...p, finalPrice: e.target.value }))}
                placeholder={autoTotal > 0 ? String(autoTotal) : 'авто'} />
              <p className="text-xs text-gray-400 mt-1">Пусто = запчасти + работы</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditPrices(false)} className="btn-secondary btn-sm">Отмена</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? '…' : '✓ Сохранить'}</button>
          </div>
        </form>
      )}

      {/* Запчасти */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">🔩 Запчасти и материалы</span>
          {canEdit && (
            <button onClick={() => setShowAdd(v => !v)} className="text-xs text-blue-600 hover:underline font-medium">
              {showAdd ? '✕ Отмена' : '+ Добавить'}
            </button>
          )}
        </div>

        {showAdd && (
          <form onSubmit={handleAddPart} className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1">
                <input className="input text-sm" required placeholder="Название *"
                  value={newPart.name} onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <input className="input text-sm" type="number" min="1" placeholder="Кол-во"
                  value={newPart.quantity} onChange={e => setNewPart(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div>
                <input className="input text-sm" type="number" min="0" required placeholder="Цена ₽ *"
                  value={newPart.price} onChange={e => setNewPart(p => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <input className="input text-sm" placeholder="Примечание"
              value={newPart.note} onChange={e => setNewPart(p => ({ ...p, note: e.target.value }))} />
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? '…' : '+ Добавить'}</button>
            </div>
          </form>
        )}

        {loading ? <div className="text-sm text-gray-400 text-center py-3">Загрузка…</div>
          : parts.length > 0 ? (
          <div className="space-y-1">
            {parts.map(p => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{p.name}</span>
                  {p.note && <span className="text-xs text-gray-400 ml-2">{p.note}</span>}
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{p.quantity} × {Number(p.price).toLocaleString('ru-RU')} ₽</div>
                <div className="text-sm font-semibold text-gray-700 w-24 text-right flex-shrink-0">
                  {(Number(p.price) * p.quantity).toLocaleString('ru-RU')} ₽
                </div>
                {canEdit && (
                  <button onClick={() => handleDeletePart(p.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none flex-shrink-0">×</button>
                )}
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-gray-100 px-2 mt-1">
              <span className="text-xs text-gray-400">Итого запчасти:</span>
              <span className="text-sm font-bold text-gray-700">{partsTotal.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">Запчасти не добавлены</p>
        )}
      </div>
    </div>
  );
}
