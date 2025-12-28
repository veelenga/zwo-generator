import type { ReactNode } from 'react';
import { Header } from './Header';
import { ApiKeyModal } from '../ai/ApiKeyModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
      <ApiKeyModal />
    </div>
  );
}
