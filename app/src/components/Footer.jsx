import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PERMANENT_TOPICS, topicLabel } from "../routes";

const SITE_NAME = "Breeders Blog";
const MLA_MONTHS = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May",
  "June",
  "July",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
];

function formatMLADate(date) {
  return `${date.getDate()} ${MLA_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function readCitationMeta() {
  return {
    title: document.title,
    author: document.body.dataset.citationAuthor || "",
    date: document.body.dataset.citationDate || "",
  };
}

// Neither a document.title mutation nor a dataset change on <body> (both
// set by PostReader once a post loads) triggers a React re-render on its
// own, so the citation watches both directly to stay in sync.
function useCitationMeta() {
  const [meta, setMeta] = useState(readCitationMeta);
  useEffect(() => {
    const update = () => setMeta(readCitationMeta());
    const titleEl = document.querySelector("title");
    const titleObserver = new MutationObserver(update);
    if (titleEl) titleObserver.observe(titleEl, { childList: true });
    const bodyObserver = new MutationObserver(update);
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-citation-author", "data-citation-date"],
    });
    return () => {
      titleObserver.disconnect();
      bodyObserver.disconnect();
    };
  }, []);
  return meta;
}

function getPageTitle(pathname, documentTitle) {
  const permanent = PERMANENT_TOPICS.find(
    (r) => r.path === pathname && r.component,
  );
  if (permanent) return permanent.label;

  const topicMatch = pathname.match(/^\/topics\/([^/]+)/);
  if (topicMatch) return topicLabel(topicMatch[1]);

  if (pathname.startsWith("/posts/")) {
    const [postTitle] = documentTitle.split(` — ${SITE_NAME}`);
    return postTitle || SITE_NAME;
  }

  if (pathname === "/admin") return "Admin";

  return SITE_NAME;
}

function Footer() {
  const { pathname, search } = useLocation();
  const { title: documentTitle, author, date } = useCitationMeta();
  const pageTitle = getPageTitle(pathname, documentTitle);
  const url = `${window.location.origin}${pathname}${search}`;

  const isPost = pathname.startsWith("/posts/") && author && date;
  const citation = isPost ? (
    <>
      {author}. &quot;{pageTitle}.&quot; <em>{SITE_NAME}</em>,{" "}
      {formatMLADate(new Date(date))}, {url}.
    </>
  ) : (
    <>
      &quot;{pageTitle}.&quot; <em>{SITE_NAME}</em>, {url}. Accessed{" "}
      {formatMLADate(new Date())}.
    </>
  );

  return (
    <footer className="bg-accent-dark text-white/70 text-center py-6 px-4 mt-10">
      <p className="text-base mb-2 text-white/90">
        The only people that change the world are the ones crazy enough to think
        they can
      </p>
      <p className="text-sm">
        &copy; {new Date().getFullYear()} {SITE_NAME}
      </p>
      <p className="text-[10px] leading-snug mt-1 wrap-break-word text-white/50">
        Cite this page: {citation}
      </p>
    </footer>
  );
}

export default Footer;
