import Modal, { ModalActions } from "./Modal";
import Button from "./Button";
import Message from "./Message";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";

// "Are you sure?" popup for a consequential action (delete, archive). Runs
// the async `onConfirm`, then closes; if it throws, the error shows here and
// the modal stays open so the user can retry or cancel.
function ConfirmModal({
  title,
  subtitle,
  children,
  confirmLabel,
  pendingLabel = "Working…",
  variant = "danger",
  onConfirm,
  onClose,
}) {
  const { run, pending, error } = useAsyncAction();

  return (
    <Modal onClose={onClose} title={title} subtitle={subtitle} className="max-w-md p-6">
      <div className="text-sm text-gray-700">{children}</div>

      {error && <Message tone="error" className="mt-3">{error}</Message>}

      <ModalActions>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={variant}
          disabled={pending}
          onClick={() =>
            run(async () => {
              await onConfirm();
              onClose();
            })
          }
        >
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
}

export default ConfirmModal;
