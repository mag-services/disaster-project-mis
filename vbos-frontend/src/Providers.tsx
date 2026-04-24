import "@fontsource/work-sans/index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "always",
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      networkMode: "always",
    },
  },
});

function Providers({ children }: React.PropsWithChildren) {
  return (
    <ColorModeProvider
      attribute="class"
      storageKey="vbos-color-mode"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark"]}
      enableColorScheme
    >
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </TooltipProvider>
    </ColorModeProvider>
  );
}

export default Providers;
