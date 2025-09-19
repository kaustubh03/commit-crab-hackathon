import * as React from 'react';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { Sidebar } from './components/layout/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Router context type
export interface RouterContext {
  queryClient: QueryClient;
}

const queryClient = new QueryClient();

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-screen overflow-hidden flex bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
