import * as React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Sidebar } from './components/layout/sidebar';

// Root layout route following TanStack Router quick-start pattern
export const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
