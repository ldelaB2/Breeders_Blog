// pages/Topic.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import { DYNAMIC_TOPICS } from "../routes";
import Post from "../components/post/Post";
import PostReader from "../components/post/PostReader";
import CreatePostModal from "../components/post/CreatePostModal";
import Icon from "../components/Icon";
import { useApi } from "../lib/api";
import { sortPosts } from "../lib/postSort";
import addPostIcon from "../assets/add_post.svg?raw";

export default function Topic() {
  const { topic } = useParams();
  const { user } = useUser();
  const api = useApi();
  const match = DYNAMIC_TOPICS.find((t) => t.slug === topic);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    if (!match) return;
    // Reset before the new fetch resolves so switching topics never briefly
    // shows the previous topic's posts under the new heading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    api
      .fetchPosts(match.slug)
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  function replacePost(updated) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function handleTogglePin(postId) {
    try {
      replacePost(await api.pinPost(postId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpvote(postId) {
    try {
      replacePost(await api.upvotePost(postId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDownvote(postId) {
    try {
      replacePost(await api.downvotePost(postId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleLock(postId) {
    try {
      replacePost(await api.lockPost(postId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleArchive(postId) {
    if (!window.confirm("Archive this post? This moves it to the Archive topic and locks it.")) {
      return;
    }
    try {
      await api.archivePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCommentCountChange(postId, commentCount) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount } : p)));
  }

  if (!match) return <div>Topic not found</div>;

  if (selectedPostId) {
    return (
      <PostReader
        postId={selectedPostId}
        onBack={() => setSelectedPostId(null)}
        onCommentCountChange={handleCommentCountChange}
      />
    );
  }

  const sortedPosts = sortPosts(posts, user?.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{match.label}</h1>

        {user && (
          <div className="group relative">
            <button
              type="button"
              onClick={() => setCreatingPost(true)}
              aria-label="Create a new post"
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <Icon svg={addPostIcon} className="h-6 w-6" />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
              Create a new post
            </span>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading posts…</p>
      ) : sortedPosts.length === 0 ? (
        <p className="text-gray-500">No posts yet for this topic.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedPosts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onSelect={(p) => setSelectedPostId(p.id)}
              onTogglePin={handleTogglePin}
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
              onToggleLock={handleToggleLock}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {creatingPost && (
        <CreatePostModal
          topicSlug={match.slug}
          onClose={() => setCreatingPost(false)}
          onCreated={(created) => setPosts((prev) => [created, ...prev])}
        />
      )}
    </div>
  );
}
