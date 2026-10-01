import { useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/react";
import PostTile from "@/components/post/PostTile";
import CreatePostModal from "@/components/post/CreatePostModal";
import IconButton from "@/components/ui/IconButton";
import Message from "@/components/ui/Message";
import Page from "@/components/ui/Page";
import Tooltip from "@/components/ui/Tooltip";
import NotFound from "./NotFound";
import { findTopic } from "@/config/topics";
import { sortPosts } from "@/lib/post/postSort";
import { usePostFeed } from "@/lib/post/usePostFeed";
import { useSeo } from "@/lib/seo/useSeo";

export default function Topic() {
  const { topic: slug } = useParams();
  const { user } = useUser();
  const topic = findTopic(slug);
  useSeo(topic && { title: topic.label, description: topic.description, path: topic.path });

  const { posts, loading, error, actions, addPost } = usePostFeed((api) => api.fetchPosts(slug), [slug], {
    enabled: Boolean(topic),
  });
  const [creatingPost, setCreatingPost] = useState(false);

  if (!topic) return <NotFound />;

  const sortedPosts = sortPosts(posts, user?.id);

  return (
    <Page>
      <div className="mb-6 flex items-center justify-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{topic.label}</h1>

        {user && (
          <Tooltip label="Create a new post">
            <IconButton
              icon="add-post"
              label="Create a new post"
              tone={null}
              className="text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              iconClassName="h-6 w-6"
              onClick={() => setCreatingPost(true)}
            />
          </Tooltip>
        )}
      </div>

      {error && <Message tone="error" className="mb-4">{error}</Message>}

      {loading ? (
        <Message>Loading posts…</Message>
      ) : sortedPosts.length === 0 ? (
        <Message>No posts yet for this topic.</Message>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedPosts.map((post) => (
            <PostTile key={post.id} post={post} actions={actions} />
          ))}
        </div>
      )}

      {creatingPost && (
        <CreatePostModal topicSlug={topic.slug} onClose={() => setCreatingPost(false)} onCreated={addPost} />
      )}
    </Page>
  );
}
