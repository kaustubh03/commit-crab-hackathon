import * as React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Sidebar } from './components/layout/sidebar';

// Root layout route following TanStack Router quick-start pattern
export const rootRoute = createRootRoute({
  component: RootComponent,
  // Basic root-level error & not found boundaries
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">
      <p className="font-semibold mb-2">Something went wrong.</p>
      <pre className="whitespace-pre-wrap text-xs opacity-80">{error?.message}</pre>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">
      <p className="font-semibold">404 - Not Found</p>
      <p className="text-xs mt-1">The page you are looking for does not exist.</p>
    </div>
  ),
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
