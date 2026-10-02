import Icon from "@/components/ui/Icon";

// The square icon-over-label button in the share modal's main row: one per
// provider, plus the "More" trigger, so the row stays visually uniform.
function ShareTile({ icon, label, onClick, ...props }) {
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

export default ShareTile;
