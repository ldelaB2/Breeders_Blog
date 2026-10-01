import Icon from "@/components/ui/Icon";

// Single button driven entirely by a provider descriptor (see
// lib/share/providers.jsx) — adding a platform never touches this file.
// `variant="icon"` is the compact square used in the modal's main row;
// `variant="row"` is the icon+label row reused inside the More popover.
function ShareProviderButton({ provider, post, origin, showToast, variant = "icon", onAfterActivate }) {
  function onClick() {
    provider.activate(post, origin, { showToast });
    onAfterActivate?.();
  }

  if (variant === "row") {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
      >
        <Icon name={provider.icon} className="h-5 w-5" />
        {provider.label}
      </button>
    );
  }

  return <ShareTile icon={provider.icon} label={provider.label} onClick={onClick} />;
}

// The square icon-over-label button in the share modal's main row; also
// the "More" trigger, so the row stays visually uniform.
export function ShareTile({ icon, label, onClick, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex w-full flex-col items-center gap-1 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
      {...props}
    >
      <Icon name={icon} className="h-6 w-6" />
      <span className="w-full truncate text-center text-[11px] text-gray-500">{label}</span>
    </button>
  );
}

export default ShareProviderButton;
