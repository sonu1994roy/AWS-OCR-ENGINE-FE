import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Suspense fallback={<div className="w-64 bg-gray-900" />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
