import { createStrictContext } from "@/lib/utils/createStrictContext";

// Value is a showToast(text) function - see ToastProvider.jsx.
export const [ToastContext, useToast] = createStrictContext("Toast");
