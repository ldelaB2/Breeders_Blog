import React from "react";
import PinnedPost from "../components/PinnedPost";
import TopPost from "../components/TopPost";
import Footer from "../components/Footer";

function Home() {
  return (
    <div>
      {/* Pinned Post */}
      <PinnedPost />
      {/* Top Post */}
      <TopPost />
    </div>
  );
}

export default Home;
