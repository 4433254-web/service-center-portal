export const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  accepted: 'Принят',
  in_diagnostics: 'На диагностике',
  waiting_approval: 'Ожидание согласования',
  in_progress: 'В работе',
  ready: 'Готов',
  issued: 'Выдан',
  cancelled: 'Отменён',
};

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_diagnostics: 'bg-yellow-100 text-yellow-700',
  waiting_approval: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  issued: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const DEVICE_TYPE_LABELS: Record<string, string> = {
  phone: 'Телефон',
  tablet: 'Планшет',
  laptop: 'Ноутбук',
  pc: 'Компьютер',
  other: 'Другое',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  receiver: 'Приёмщик',
  master: 'Мастер',
  manager: 'Руководитель',
};

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  accepted: ['in_diagnostics', 'cancelled'],
  in_diagnostics: ['waiting_approval', 'in_progress', 'cancelled'],
  waiting_approval: ['in_progress', 'cancelled'],
  in_progress: ['ready'],
  ready: ['issued'],
  issued: [],
  cancelled: [],
};
