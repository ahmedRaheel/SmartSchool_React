import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../../features/auth/auth";
import { UiProvider } from "../../components/ui/InteractiveUi";
import { MockDataProvider } from "../../mocks/MockDataProvider";
import { router } from "../router/router";
import { GlobalApiLoader } from "../../components/ui/GlobalApiLoader";
import { GlobalApiFeedback } from "../../components/ui/GlobalApiFeedback";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
        },
    },
});
export function AppProviders() {
    return (<QueryClientProvider client={queryClient}>
      <UiProvider><GlobalApiLoader/><GlobalApiFeedback/>
<MockDataProvider>
<AuthProvider>
<RouterProvider router={router}/>
</AuthProvider>
</MockDataProvider>
</UiProvider>
    </QueryClientProvider>);
}

