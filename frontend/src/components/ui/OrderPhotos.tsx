'use client';
import { useEffect, useRef, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatDate } from '@/lib/helpers';

const STAGE_LABELS: Record<string, string> = {
  acceptance: '📥 При приёмке',
  repair: '🔧 В процессе ремонта',
  done: '✅ После ремонта',
  other: '📌 Другое',
};

interface Props {
  orderId: string;
  canUpload: boolean;
}

export default function OrderPhotos({ orderId, canUpload }: Props) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState('acceptance');
  const [comment, setComment] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try { setPhotos(await ordersApi.photos(orderId)); }
    catch { } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [orderId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await ordersApi.uploadPhoto(orderId, file, comment, stage);
      }
      setComment('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally { setUploading(false); }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Удалить фото?')) return;
    await ordersApi.deletePhoto(orderId, photoId);
    await load();
  }

  const grouped = photos.reduce((acc: Record<string, any[]>, p: any) => {
    const s = p.stage || 'other';
    if (!acc[s]) acc[s] = [];
    acc[s].push(p);
    return acc;
  }, {} as Record<string, any[]>);
    <div className="card p-5">
      <h2 className="text-base font-semibold text-gray-700 mb-3">🖼 Фотографии</h2>

      {canUpload && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex gap-2">
            <select className="input flex-1 text-sm" value={stage} onChange={e => setStage(e.target.value)}>
              {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <input className="input text-sm" placeholder="Комментарий к фото (необязательно)" value={comment} onChange={e => setComment(e.target.value)} />
          <label className={`btn-secondary btn-sm w-full justify-center cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? 'Загрузка…' : '📷 Добавить фото'}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      {loading && <div className="text-gray-400 text-sm text-center py-4">Загрузка…</div>}

      {!loading && !photos.length && (
        <p className="text-gray-400 text-sm text-center py-4">Фотографий пока нет</p>
      )}

      {Object.entries(grouped).map(([s, items]) => (
        <div key={s} className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">{STAGE_LABELS[s] ?? s}</div>
          <div className="grid grid-cols-3 gap-2">
            {items.map((p: any) => (
              <div key={p.id} className="relative group">
                <img
                  src={`/api/files/${p.id}/download`}
                  alt={p.originalName}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-blue-400 transition-colors"
                  onClick={() => setLightbox(`/api/files/${p.id}/download`)}
                  onError={e => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
                />
                {p.comment && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">{p.comment}</div>
                )}
                {canUpload && (
                  <button onClick={() => handleDelete(p.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="Просмотр фото" />
          <button className="absolute top-4 right-4 text-white text-3xl leading-none" onClick={() => setLightbox(null)}>×</button>
        </div>
      )}
    </div>
  );
}
