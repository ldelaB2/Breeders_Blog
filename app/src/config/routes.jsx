import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import Topic from "@/pages/Topic";
import PostPage from "@/pages/PostPage";
import NotFound from "@/pages/NotFound";

// The single table behind the router (App.jsx), the header nav
// (DesktopNav/MobileMenu) and the footer's page titles - add a page here
// and it shows up in all three.
//
//   element  what the route renders; entries without one are nav-only
//   label    nav text and the footer's citation title
//   nav      "link" = a nav link, "topics" = the topics dropdown, omitted = not in the nav
//   role     "ADMIN" | "MODERATOR": the route is wrapped in RequireRole and the
//            nav link only shows for that role. The backend enforces it
//            independently on every endpoint - this is UX, not the boundary.
export const ROUTES = [
  { path: "/", label: "Home", element: <Home />, nav: "link" },
  { path: "/topics", label: "Topics", nav: "topics" },
  { path: "/about", label: "About", element: <About />, nav: "link" },
  { path: "/contact", label: "Contact", element: <Contact />, nav: "link" },
  { path: "/admin", label: "Admin", element: <Admin />, nav: "link", role: "ADMIN" },
  { path: "/topics/:topic", element: <Topic /> },
  { path: "/posts/:id/:slug?", element: <PostPage /> },
  { path: "*", element: <NotFound /> },
];

// The nav entries the current viewer may see; `hasRole` comes from useCurrentUser().
export const navRoutes = (hasRole) => ROUTES.filter((r) => r.nav && (!r.role || hasRole(r.role)));

// The label of the static page at `pathname`, if it is one.
export const routeLabel = (pathname) => ROUTES.find((r) => r.element && r.label && r.path === pathname)?.label;
