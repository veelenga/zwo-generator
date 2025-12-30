import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ApiKeyModal } from '../ai/ApiKeyModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
      <Footer />
      <ApiKeyModal />
    </div>
  );
}
