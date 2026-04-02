import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
export const metadata: Metadata = { title: 'Сервисный центр', description: 'Система управления ремонтами' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
