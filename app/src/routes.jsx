import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";

// All dynamic topics render through the single shared pages/Topic.jsx
// component at /topics/:topic — add a new topic by adding a row here. The
// description is the topic page's meta description for search engines.
export const DYNAMIC_TOPICS = [
  {
    slug: "gs",
    label: "Genomic Selection",
    description:
      "Genomic selection: prediction models, training populations, and putting marker data to work in breeding programs.",
  },
  {
    slug: "qg",
    label: "Quantitative Genetics",
    description:
      "Quantitative genetics: heritability, breeding values, variance components, and the theory behind selection.",
  },
  {
    slug: "ml",
    label: "Machine Learning",
    description: "Machine learning applied to plant breeding, phenotyping, and genomic data.",
  },
  {
    slug: "math",
    label: "Mathematics",
    description: "The mathematics and statistics that underpin modern breeding methods.",
  },
  {
    slug: "drones",
    label: "Drones",
    description: "Drones, sensors, and high-throughput phenotyping in the field.",
  },
  {
    slug: "ip",
    label: "Intellectual Property",
    description: "Intellectual property in plant breeding: plant variety protection, patents, and licensing.",
  },
  {
    slug: "mb",
    label: "Molecular Biology",
    description: "Molecular biology for breeders: genes, markers, and gene editing.",
  },
  {
    slug: "bioinfo",
    label: "Bioinformatics",
    description: "Bioinformatics: pipelines, tools, and data handling for breeding and genomics.",
  },
  {
    slug: "history",
    label: "History of Breeding",
    description: "The history of plant breeding, from domestication to genomic selection.",
  },
  {
    slug: "archive",
    label: "Archive",
    description: "Older posts, archived and closed to comments.",
  },
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
