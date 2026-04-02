'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/Layout/AppLayout';
import Alert from '@/components/ui/Alert';
import { ordersApi, clientsApi, devicesApi } from '@/lib/api';
import { DEVICE_TYPE_LABELS } from '@/lib/helpers';

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<'client' | 'device' | 'order'>('client');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({ fullName: '', phone: '', email: '' });
  const [clientMode, setClientMode] = useState<'search' | 'new'>('search');

  const [deviceSearch, setDeviceSearch] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [newDevice, setNewDevice] = useState({ deviceType: 'phone', brand: '', model: '', imei: '', color: '', conditionDescription: '' });
  const [deviceMode, setDeviceMode] = useState<'search' | 'new'>('search');

  const [orderForm, setOrderForm] = useState({
    issueDescription: '', conditionAtAcceptance: '', includedItems: '',
    estimatedPrice: '', estimatedReadyAt: '', receiverComment: '',
  });

  useEffect(() => {
    if (clientSearch.length >= 2)
      clientsApi.list({ search: clientSearch, limit: '10' }).then(r => setClients(r.items)).catch(() => {});
  }, [clientSearch]);

  useEffect(() => {
    if (selectedClient && deviceSearch.length >= 1)
      devicesApi.list({ search: deviceSearch, clientId: selectedClient.id, limit: '10' }).then(r => setDevices(r.items)).catch(() => {});
  }, [deviceSearch, selectedClient]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let clientId = selectedClient?.id;
      if (!clientId) { const c = await clientsApi.create(newClient); clientId = c.id; }
      let deviceId = selectedDevice?.id;
      if (!deviceId) { const d = await devicesApi.create({ ...newDevice, clientId }); deviceId = d.id; }
      const order = await ordersApi.create({
        clientId, deviceId, ...orderForm,
        estimatedPrice: orderForm.estimatedPrice ? Number(orderForm.estimatedPrice) : undefined,
        estimatedReadyAt: orderForm.estimatedReadyAt || undefined,
      });
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Ошибка при создании заказа');
    } finally { setSaving(false); }
  }

  const canGoToDevice = selectedClient || (newClient.fullName && newClient.phone);
  const canGoToOrder = selectedDevice || (newDevice.brand && newDevice.model);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</button>
          <h1 className="page-title">Новый заказ</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {[['client','1. Клиент'],['device','2. Устройство'],['order','3. Заказ']].map(([s,label]) => (
            <div key={s} className={`flex-1 text-center py-2 rounded-lg text-sm font-medium border ${step===s?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-500 border-gray-200'}`}>{label}</div>
          ))}
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        {step === 'client' && (
          <div className="card p-6">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setClientMode('search')} className={`btn btn-sm ${clientMode==='search'?'btn-primary':'btn-secondary'}`}>Найти клиента</button>
              <button onClick={() => setClientMode('new')} className={`btn btn-sm ${clientMode==='new'?'btn-primary':'btn-secondary'}`}>Новый клиент</button>
            </div>
            {clientMode === 'search' ? (
              <div>
                <label className="label">Поиск по имени или телефону</label>
                <input className="input mb-3" placeholder="Введите имя или телефон…" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                {clients.map(c => (
                  <div key={c.id} onClick={() => setSelectedClient(c)} className={`p-3 rounded-lg border cursor-pointer mb-2 ${selectedClient?.id===c.id?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-medium text-sm">{c.fullName}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </div>
                ))}
                {!clients.length && clientSearch.length >= 2 && <p className="text-sm text-gray-400">Клиент не найден. <button className="text-blue-600 hover:underline" onClick={() => setClientMode('new')}>Создать нового</button></p>}
              </div>
            ) : (
              <div className="space-y-3">
                <div><label className="label">ФИО *</label><input className="input" value={newClient.fullName} onChange={e => setNewClient(f=>({...f,fullName:e.target.value}))} placeholder="Иванов Иван Иванович" /></div>
                <div><label className="label">Телефон *</label><input className="input" value={newClient.phone} onChange={e => setNewClient(f=>({...f,phone:e.target.value}))} placeholder="+79991234567" /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={newClient.email} onChange={e => setNewClient(f=>({...f,email:e.target.value}))} /></div>
              </div>
            )}
            {selectedClient && <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">✅ <strong>{selectedClient.fullName}</strong> ({selectedClient.phone}) <button onClick={()=>setSelectedClient(null)} className="ml-2 text-red-500 text-xs">изменить</button></div>}
            <button onClick={() => setStep('device')} disabled={!canGoToDevice} className="btn-primary w-full justify-center mt-4">Далее: Устройство →</button>
          </div>
        )}

        {step === 'device' && (
          <div className="card p-6">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setDeviceMode('search')} className={`btn btn-sm ${deviceMode==='search'?'btn-primary':'btn-secondary'}`}>Найти устройство</button>
              <button onClick={() => setDeviceMode('new')} className={`btn btn-sm ${deviceMode==='new'?'btn-primary':'btn-secondary'}`}>Новое устройство</button>
            </div>
            {deviceMode === 'search' ? (
              <div>
                <label className="label">Поиск по модели или IMEI</label>
                <input className="input mb-3" placeholder="Введите модель или IMEI…" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} />
                {devices.map(d => (
                  <div key={d.id} onClick={() => setSelectedDevice(d)} className={`p-3 rounded-lg border cursor-pointer mb-2 ${selectedDevice?.id===d.id?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-medium text-sm">{d.brand} {d.model}</div>
                    <div className="text-xs text-gray-400">{DEVICE_TYPE_LABELS[d.deviceType]}{d.imei?` · IMEI: ${d.imei}`:''}</div>
                  </div>
                ))}
                {!devices.length && deviceSearch.length >= 1 && <p className="text-sm text-gray-400">Не найдено. <button className="text-blue-600 hover:underline" onClick={() => setDeviceMode('new')}>Добавить новое</button></p>}
              </div>
            ) : (
              <div className="space-y-3">
                <div><label className="label">Тип *</label>
                  <select className="input" value={newDevice.deviceType} onChange={e => setNewDevice(f=>({...f,deviceType:e.target.value}))}>
                    {Object.entries(DEVICE_TYPE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Бренд *</label><input className="input" value={newDevice.brand} onChange={e => setNewDevice(f=>({...f,brand:e.target.value}))} placeholder="Apple" /></div>
                  <div><label className="label">Модель *</label><input className="input" value={newDevice.model} onChange={e => setNewDevice(f=>({...f,model:e.target.value}))} placeholder="iPhone 13" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">IMEI</label><input className="input" value={newDevice.imei} onChange={e => setNewDevice(f=>({...f,imei:e.target.value}))} /></div>
                  <div><label className="label">Цвет</label><input className="input" value={newDevice.color} onChange={e => setNewDevice(f=>({...f,color:e.target.value}))} /></div>
                </div>
              </div>
            )}
            {selectedDevice && <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">✅ <strong>{selectedDevice.brand} {selectedDevice.model}</strong><button onClick={()=>setSelectedDevice(null)} className="ml-2 text-red-500 text-xs">изменить</button></div>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('client')} className="btn-secondary flex-1 justify-center">← Назад</button>
              <button onClick={() => setStep('order')} disabled={!canGoToOrder} className="btn-primary flex-1 justify-center">Далее: Заказ →</button>
            </div>
          </div>
        )}

        {step === 'order' && (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div><label className="label">Заявленная неисправность *</label>
              <textarea className="input" rows={3} required value={orderForm.issueDescription} onChange={e => setOrderForm(f=>({...f,issueDescription:e.target.value}))} placeholder="Не включается, разбит экран…" /></div>
            <div><label className="label">Состояние при приёме *</label>
              <textarea className="input" rows={2} required value={orderForm.conditionAtAcceptance} onChange={e => setOrderForm(f=>({...f,conditionAtAcceptance:e.target.value}))} placeholder="Царапины на корпусе…" /></div>
            <div><label className="label">Комплектация</label>
              <input className="input" value={orderForm.includedItems} onChange={e => setOrderForm(f=>({...f,includedItems:e.target.value}))} placeholder="Кабель, чехол…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Предв. стоимость, ₽</label>
                <input className="input" type="number" min="0" value={orderForm.estimatedPrice} onChange={e => setOrderForm(f=>({...f,estimatedPrice:e.target.value}))} placeholder="3500" /></div>
              <div><label className="label">Срок готовности</label>
                <input className="input" type="datetime-local" value={orderForm.estimatedReadyAt} onChange={e => setOrderForm(f=>({...f,estimatedReadyAt:e.target.value}))} /></div>
            </div>
            <div><label className="label">Комментарий</label>
              <textarea className="input" rows={2} value={orderForm.receiverComment} onChange={e => setOrderForm(f=>({...f,receiverComment:e.target.value}))} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep('device')} className="btn-secondary flex-1 justify-center">← Назад</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?'Сохранение…':'✓ Создать заказ'}</button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
