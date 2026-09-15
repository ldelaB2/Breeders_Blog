import { createContext } from "react";

// Value is a showToast(text) function - see ToastProvider.jsx / useToast.js.
export const ToastContext = createContext(null);
