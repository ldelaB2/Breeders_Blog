import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/react";
import { ToastProvider } from "./lib/ToastProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ClerkProvider>
  </StrictMode>,
);
