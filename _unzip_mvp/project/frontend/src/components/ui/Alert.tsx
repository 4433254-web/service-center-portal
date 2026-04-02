export default function Alert({ type = 'error', message }: { type?: 'error' | 'success' | 'info'; message: string }) {
  const cls = type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200';
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{message}</div>;
}
