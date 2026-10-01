import PostCarousel from "./PostCarousel";

// Rendered between a post's body and its comments (see PostReader.jsx).
// `count` is the post's own linkedPostCount (from serializePost), so the
// section - and the carousel's fetch - is skipped entirely for the common
// case of a post with no linked posts, rather than flashing an empty header.
function LinkedPosts({ postId, count }) {
  if (!count) return null;

  return (
    <div className="border-t border-gray-200 px-6 py-6">
      <h2 className="mb-3 text-lg font-bold text-gray-900">Linked Posts</h2>
      <PostCarousel fetchPosts={(api) => api.fetchLinkedPosts(postId)} emptyMessage="No linked posts." />
    </div>
  );
}

export default LinkedPosts;
