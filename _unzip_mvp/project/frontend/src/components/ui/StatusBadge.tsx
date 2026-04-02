import { STATUS_LABELS, STATUS_COLORS } from '@/lib/helpers';
export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>{STATUS_LABELS[status] ?? status}</span>;
}
