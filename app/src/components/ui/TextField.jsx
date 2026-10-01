import { useId } from "react";

const INPUT_CLASS =
  "w-full rounded-md border border-gray-200 p-2 text-sm text-gray-900 focus:border-transparent focus:outline-none";

// Labeled text input (or textarea with `multiline`). With `limit`, input is
// capped at that many characters and a live "12/100" counter is shown.
// onChange receives the new string, not the event.
function TextField({ label, value, onChange, limit, multiline = false, rows = 5, ...props }) {
  const id = useId();
  const Input = multiline ? "textarea" : "input";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {limit && (
          <span className="text-xs text-gray-400">
            {value.length}/{limit}
          </span>
        )}
      </div>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(limit ? e.target.value.slice(0, limit) : e.target.value)}
        maxLength={limit}
        {...(multiline ? { rows, className: `${INPUT_CLASS} resize-none` } : { type: "text", className: INPUT_CLASS })}
        {...props}
      />
    </div>
  );
}

export default TextField;
