import { cn } from "@/lib/utils/cn";

// The standard centered page column. `title` renders the page's <h1>.
function Page({ title, className, children }) {
  return (
    <div className={cn("mx-auto max-w-6xl px-6 py-8", className)}>
      {title && <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>}
      {children}
    </div>
  );
}

export default Page;
