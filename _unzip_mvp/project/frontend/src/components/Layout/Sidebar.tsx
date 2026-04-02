'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: '📊', roles: [] },
  { href: '/orders', label: 'Заказы', icon: '🔧', roles: [] },
  { href: '/clients', label: 'Клиенты', icon: '👤', roles: ['admin', 'receiver', 'manager'] },
  { href: '/users', label: 'Пользователи', icon: '⚙️', roles: ['admin'] },
];

export default function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const visible = navItems.filter(item =>
    item.roles.length === 0 || item.roles.some(r => user?.roles?.includes(r))
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="text-lg font-bold text-white">🔩 СервисЦентр</div>
        <div className="text-xs text-gray-400 mt-0.5">Система управления</div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {visible.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <div className="px-3 py-2 mb-2">
          <div className="text-sm font-medium text-white truncate">{user?.login}</div>
          <div className="text-xs text-gray-400">{user?.roles?.join(', ')}</div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
}
