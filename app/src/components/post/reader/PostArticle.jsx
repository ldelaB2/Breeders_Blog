import { useEffect, useMemo, useRef, useState } from "react";
import PostBody from "./PostBody";
import { MobileToc, SidebarToc } from "./Toc";
import LinkedPosts from "../LinkedPosts";
import CommentSection from "@/components/comment/CommentSection";
import { extractPostHtml } from "@/lib/post/postHtml";
import { usePostFrame } from "@/lib/post/usePostFrame";

// A loaded post: table of contents, abstract, the rendered body, then
// linked posts and comments.
function PostArticle({ post }) {
  const iframeRef = useRef(null);
  const abstractRef = useRef(null);
  const [navOffset, setNavOffset] = useState(0);
  const { html, toc } = useMemo(() => extractPostHtml(post.html), [post.html]);
  const { height, goToSection } = usePostFrame(iframeRef);
  const showToc = toc.length > 1;

  // Pushes the TOC nav's starting position down by half the abstract's
  // height, so it's anchored at the abstract's vertical center rather than
  // its top (it can't stick past the end of its containing row, so it
  // already stays clear of the comments below).
  useEffect(() => {
    const el = abstractRef.current;
    if (!el) return;
    const measure = () => setNavOffset(el.offsetHeight / 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.abstract]);

  return (
    <>
      {showToc && <MobileToc items={toc} onSelect={goToSection} />}

      <div className="flex gap-8">
        {showToc && <SidebarToc items={toc} onSelect={goToSection} offset={navOffset} />}

        <div className="min-w-0 flex-1">
          <p ref={abstractRef} className="border-b border-canvas-border pb-4 text-sm text-gray-600">
            {post.abstract}
          </p>
          <PostBody ref={iframeRef} title={post.title} html={html} height={height} />
        </div>
      </div>

      <LinkedPosts postId={post.id} count={post.linkedPostCount} />

      <CommentSection postId={post.id} locked={post.locked} />
    </>
  );
}

export default PostArticle;
