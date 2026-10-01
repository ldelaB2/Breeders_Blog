import { useUser } from "@clerk/react";
import PostCarousel from "@/components/post/PostCarousel";
import Page from "@/components/ui/Page";
import { useSeo } from "@/lib/seo/useSeo";

function Home() {
  const { user } = useUser();
  useSeo({ path: "/" });

  return (
    <Page className="flex flex-col gap-10">
      <PostCarousel title="Top Posts" fetchPosts={(api) => api.fetchTopPosts(5)} emptyMessage="No posts yet." />

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
    </Page>
  );
}

export default Home;
