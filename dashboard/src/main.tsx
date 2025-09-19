import React from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterDevtools } from "@tanstack/router-devtools";
import { routeTree } from "../app/routeTree.gen";
import "./globals.css";

// Single shared QueryClient instance for the application
const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    // Provide the queryClient via TanStack Router context if needed by routes
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
