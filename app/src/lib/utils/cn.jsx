// Joins class names, skipping falsy entries: cn("p-2", active && "bg-gray-100").
export const cn = (...classes) => classes.filter(Boolean).join(" ");
