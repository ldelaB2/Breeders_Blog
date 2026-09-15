// routes.js
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";

// All dynamic topics render through the single shared pages/Topic.jsx
// component at /topics/:topic — add a new topic by adding a row here.
export const DYNAMIC_TOPICS = [
  { slug: "gs", label: "Genomic Selection" },
  { slug: "qg", label: "Quantitative Genetics" },
  { slug: "ml", label: "Machine Learning" },
  { slug: "math", label: "Mathematics" },
  { slug: "drones", label: "Drones" },
  { slug: "history", label: "History of Breeding" },
  { slug: "archive", label: "Archive" },
].map((t) => ({ ...t, path: `/topics/${t.slug}` }));

export function topicLabel(slug) {
  return DYNAMIC_TOPICS.find((t) => t.slug === slug)?.label ?? slug;
}

export const PERMANENT_TOPICS = [
  { path: "/", label: "Home", component: Home },
  { path: "/topics", label: "Topics", component: null }, // dropdown trigger
  { path: "/about", label: "About", component: About },
  { path: "/contact", label: "Contact", component: Contact },
];
