import ArticleSection from "./ArticleSection";
import PostCarousel from "../PostCarousel";

// Rendered between a post's body and its comments (see PostArticle.jsx).
// `count` is the post's own linkedPostCount (from serializePost), so the
// section - and the carousel's fetch - is skipped entirely for the common
// case of a post with no linked posts, rather than flashing an empty header.
function LinkedPosts({ postId, count }) {
  if (!count) return null;

  return (
    <ArticleSection title="Linked Posts">
      <div className="mt-3">
        <PostCarousel fetchPosts={(api) => api.fetchLinkedPosts(postId)} emptyMessage="No linked posts." />
      </div>
    </ArticleSection>
  );
}

export default LinkedPosts;
