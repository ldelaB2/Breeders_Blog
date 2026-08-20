import React from "react";
import Header from "../components/Header";
import IntroPost from "../components/IntroPost";
import Search from "../components/Search";
import Threads from "../components/Threads";
import Footer from "../components/Footer";

function Home() {
  return (
    <div>
      {/* Header */}
      <Header />
      {/* Intro Post */}
      <IntroPost />
      {/* Search */}
      <Search />
      {/* Threads */}
      <Threads />
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;
