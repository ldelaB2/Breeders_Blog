import { BrowserRouter, Routes, Route } from "react-router-dom";
import Topic from "./pages/Topic";
import Admin from "./pages/Admin";
import PostPage from "./pages/PostPage";
import { PERMANENT_TOPICS } from "./routes";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            {PERMANENT_TOPICS.filter((r) => r.component).map(
              ({ path, component: C }) => (
                <Route key={path} path={path} element={<C />} />
              ),
            )}

            <Route path="/topics/:topic" element={<Topic />} />
            <Route path="/posts/:id" element={<PostPage />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
