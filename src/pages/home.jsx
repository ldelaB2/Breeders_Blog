import React from "react";
import PinnedPost from "../components/PinnedPost";
import TopPost from "../components/TopPost";
import Footer from "../components/Footer";

function Home() {
  return (
    <div>
      {/* Top Post */}
      <TopPost />
      {/* Pinned Post */}
      <PinnedPost />
    </div>
  );
}

export default Home;
