// A post's title (truncated to one line) over its abstract (clamped to
// two), for compact lists: search results, the link-posts modal. `meta`
// sits at the end of the title row (e.g. a topic badge).
function PostSummary({ post, meta }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-semibold text-gray-900">{post.title}</span>
        {meta}
      </div>
      <p className="line-clamp-2 text-sm text-gray-600">{post.abstract}</p>
    </div>
  );
}

export default PostSummary;
