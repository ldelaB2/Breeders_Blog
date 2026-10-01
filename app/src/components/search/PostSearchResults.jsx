import Badge from "@/components/ui/Badge";
import Message from "@/components/ui/Message";
import { topicLabel } from "@/config/topics";

// The results list under a post search box (header search, link-posts
// modal): "Searching…", "No posts found.", or one clickable row per post.
// Renders nothing until something has been typed. `disabled` blocks
// selection (e.g. while the link-posts modal is adding one).
function PostSearchResults({ query, results, loading, onSelect, disabled = false }) {
  if (!query.trim()) return null;
  if (loading) return <Message className="px-3 py-2 text-sm">Searching…</Message>;
  if (results.length === 0) return <Message className="px-3 py-2 text-sm">No posts found.</Message>;

  return (
    <ul className="flex flex-col divide-y divide-gray-100">
      {results.map((post) => (
        <li key={post.id}>
          <button
            type="button"
            onClick={() => onSelect(post)}
            disabled={disabled}
            className="flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold text-gray-900">{post.title}</span>
              <Badge>{topicLabel(post.topicSlug)}</Badge>
            </div>
            <p className="line-clamp-2 text-sm text-gray-600">{post.abstract}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default PostSearchResults;
