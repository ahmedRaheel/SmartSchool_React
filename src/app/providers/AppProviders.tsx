import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../../features/auth/auth";
import { UiProvider } from "../../components/ui/InteractiveUi";
import { router } from "../router/router";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <UiProvider><AuthProvider><RouterProvider router={router} /></AuthProvider></UiProvider>
    </QueryClientProvider>
  );
}
