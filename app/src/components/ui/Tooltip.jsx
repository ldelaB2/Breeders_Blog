// Hover label shown below its child (e.g. an icon-only button).
function Tooltip({ label, children }) {
  return (
    <div className="group relative">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

export default Tooltip;
