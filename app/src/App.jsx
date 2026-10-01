import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ROUTES } from "@/config/routes";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/layout/RequireRole";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            {ROUTES.filter((r) => r.element).map(({ path, element, role }) => (
              <Route key={path} path={path} element={role ? <RequireRole role={role}>{element}</RequireRole> : element} />
            ))}
          </Routes>
        </main>
        <Footer />
      </div>
      {/* Vercel Web Analytics (dashboard only - post ranking counts views itself, see PostReader) */}
      <Analytics />
    </BrowserRouter>
  );
}
