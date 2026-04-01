export default function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <span className="text-sm text-gray-500">Всего: {total}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="btn btn-secondary btn-sm disabled:opacity-40">‹</button>
        <span className="px-3 py-1.5 text-sm text-gray-700">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="btn btn-secondary btn-sm disabled:opacity-40">›</button>
      </div>
    </div>
  );
}
