// pages/Topic.jsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { DYNAMIC_TOPICS } from "../routes";
import Post from "../components/post/Post";
import PostReader from "../components/post/PostReader";
import posts from "../../sample_post/posts.json";

export default function Topic() {
  const { topic } = useParams();
  const [selectedPost, setSelectedPost] = useState(null);
  const match = DYNAMIC_TOPICS.find((t) => t.slug === topic);

  if (!match) return <div>Topic not found</div>;

  if (selectedPost) {
    return (
      <PostReader post={selectedPost} onBack={() => setSelectedPost(null)} />
    );
  }

  const topicPosts = posts
    .filter((p) => p.topic === match.slug)
    .sort((a, b) => b.pinned - a.pinned);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {match.label}
      </h1>

      {topicPosts.length === 0 ? (
        <p className="text-gray-500">No posts yet for this topic.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {topicPosts.map((post) => (
            <Post key={post.id} post={post} onSelect={setSelectedPost} />
          ))}
        </div>
      )}
    </div>
  );
}
