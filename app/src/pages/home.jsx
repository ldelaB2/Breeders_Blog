// pages/Home.jsx
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import PostCarousel from "../components/post/PostCarousel";

function Home() {
  const { user } = useUser();
  const navigate = useNavigate();

  function openPost(postId) {
    navigate(`/posts/${postId}`);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
      <PostCarousel
        title="Top Posts"
        fetchPosts={(api) => api.fetchTopPosts(5)}
        emptyMessage="No posts yet."
        onSelectPost={openPost}
      />

      {user && (
        <PostCarousel
          title="Your Pinned Posts"
          fetchPosts={(api) => api.fetchPins()}
          emptyMessage="You haven't pinned any posts yet."
          onSelectPost={openPost}
        />
      )}

      {user && (
        <PostCarousel
          title="Recommended for You"
          fetchPosts={(api) => api.fetchRecommendations()}
          emptyMessage="Vote, comment, or pin a few posts to get recommendations."
          onSelectPost={openPost}
        />
      )}
    </div>
  );
}

export default Home;
