import { useLocation } from "react-router-dom";
import { PERMANENT_TOPICS, topicLabel } from "../routes";
import { useCitation } from "../lib/citation";

const SITE_NAME = "Breeders Blog";
const MLA_MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

function formatMLADate(date) {
  return `${date.getDate()} ${MLA_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getPageTitle(pathname) {
  const permanent = PERMANENT_TOPICS.find((r) => r.path === pathname && r.component);
  if (permanent) return permanent.label;
  const topicMatch = pathname.match(/^\/topics\/([^/]+)/);
  if (topicMatch) return topicLabel(topicMatch[1]);
  if (pathname === "/admin") return "Admin";
  return SITE_NAME;
}

function Footer() {
  const { pathname, search } = useLocation();
  const post = useCitation(); // set by PostReader while a post is open
  const url = `${window.location.origin}${pathname}${search}`;

  const citation = post ? (
    <>
      {post.author}. &quot;{post.title}.&quot; <em>{SITE_NAME}</em>, {formatMLADate(new Date(post.date))}, {url}.
    </>
  ) : (
    <>
      &quot;{getPageTitle(pathname)}.&quot; <em>{SITE_NAME}</em>, {url}. Accessed {formatMLADate(new Date())}.
    </>
  );

  return (
    <footer className="bg-accent-dark text-white/70 text-center py-6 px-4 mt-10">
      <p className="text-base mb-2 text-white/90">
        The only people that change the world are the ones crazy enough to think they can
      </p>
      <p className="text-sm">
        &copy; {new Date().getFullYear()} {SITE_NAME}
      </p>
      <p className="text-[10px] leading-snug mt-1 wrap-break-word text-white/50">Cite this page: {citation}</p>
    </footer>
  );
}

export default Footer;
