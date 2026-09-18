import { useUser } from "@clerk/react";
import PostCarousel from "../components/post/PostCarousel";
import { useSeo } from "../lib/useSeo";

function Home() {
  const { user } = useUser();
  useSeo({ path: "/" });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
      <PostCarousel
        title="Top Posts"
        fetchPosts={(api) => api.fetchTopPosts(5)}
        emptyMessage="No posts yet."
      />

      {user && (
        <PostCarousel
          title="Your Pinned Posts"
          fetchPosts={(api) => api.fetchPins()}
          emptyMessage="You haven't pinned any posts yet."
        />
      )}

      {user && (
        <PostCarousel
          title="Recommended for You"
          fetchPosts={(api) => api.fetchRecommendations()}
          emptyMessage="Vote, comment, or pin a few posts to get recommendations."
        />
      )}
    </div>
  );
}

export default Home;
