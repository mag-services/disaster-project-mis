import { StrictMode } from "react";
import "./index.css";
import "@fontsource-variable/work-sans/index.css";
import "@flaticon/flaticon-uicons/css/solid/rounded.css";
import "./Theme/accessibility.css";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import Providers from "./Providers.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
        <Toaster
          richColors
          position="top-right"
          closeButton
          visibleToasts={3}
          gap={10}
          toastOptions={{
            duration: 4500,
            classNames: {
              toast: "drmis-panel-enter rounded-[var(--drmis-radius-card)] border-border shadow-[var(--drmis-shadow-sm)]",
            },
          }}
        />
      </Providers>
    </ErrorBoundary>
  </StrictMode>
);
