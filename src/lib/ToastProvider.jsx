import { useState, useCallback, useRef } from "react";
import { ToastContext } from "./toastContext";

// App-wide toast used for one thing right now: telling a signed-out
// visitor to sign in before an action (vote/pin/comment) that needs it.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { id, text }
  const timeoutRef = useRef(null);

  const showToast = useCallback((text) => {
    clearTimeout(timeoutRef.current);
    setToast({ id: Date.now(), text });
    timeoutRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="toast-fade pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast.text}
        </div>
      )}
    </ToastContext.Provider>
  );
}
