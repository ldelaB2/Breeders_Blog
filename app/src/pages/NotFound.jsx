import { Link } from "react-router-dom";
import Page from "@/components/ui/Page";
import { useSeo } from "@/lib/seo/useSeo";

// Catch-all for unknown routes and topics. api/post.js handles the HTTP
// status for bad post ids; here noindex keeps stray URLs out of search.
export default function NotFound() {
  useSeo({ title: "Page not found", noindex: true });
  return (
    <Page title="Page not found" className="text-center">
      <p className="text-gray-700">
        Nothing lives at this address.{" "}
        <Link to="/" className="underline">
          Back to the home page
        </Link>
        .
      </p>
    </Page>
  );
}
