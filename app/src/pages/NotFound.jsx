import { Link } from "react-router-dom";
import { useSeo } from "../lib/useSeo";

// Catch-all for unknown routes and topics. api/post.js handles the HTTP
// status for bad post ids; here noindex keeps stray URLs out of search.
export default function NotFound() {
  useSeo({ title: "Page not found", noindex: true });
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-4 text-gray-700">
        Nothing lives at this address.{" "}
        <Link to="/" className="underline">
          Back to the home page
        </Link>
        .
      </p>
    </div>
  );
}
