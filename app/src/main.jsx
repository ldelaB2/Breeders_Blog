import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/react";
import { ToastProvider } from "@/lib/toast/ToastProvider";
import { CurrentUserProvider } from "@/lib/auth/CurrentUserProvider";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider>
      <CurrentUserProvider>
        <ToastProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ToastProvider>
      </CurrentUserProvider>
    </ClerkProvider>
  </StrictMode>,
);
