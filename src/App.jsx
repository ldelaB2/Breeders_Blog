// src/App.jsx (or wherever your top-level routing lives)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Math from "./pages/math";
import QuantGen from "./pages/QuantGen";
import GS from "./pages/GS";
import ML from "./pages/ML";
import Drones from "./pages/Drones";
import Archive from "./pages/Archive";

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/math" element={<Math />} />
            <Route path="/qg" element={<QuantGen />} />
            <Route path="/gs" element={<GS />} />
            <Route path="/ml" element={<ML />} />
            <Route path="/drones" element={<Drones />} />
            <Route path="/archive" element={<Archive />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
