import Message from "@/components/ui/Message";

// The post's stitched HTML, in an iframe sized to its content (`height`
// comes from usePostFrame). `html` is null while the post is pending review.
function PostBody({ ref, title, html, height }) {
  if (!html) {
    return (
      <Message className="px-6 py-8 text-center text-sm">
        This post is still pending review, so there's no preview yet.
      </Message>
    );
  }

  // Sandboxed without allow-same-origin: the post's own scripts (Plotly
  // charts etc.) still run, but in an opaque origin with no access to the
  // app, its DOM, or the viewer's Clerk session. Admin moderation is the
  // first gate; this is the second.
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      scrolling="no"
      style={{ height: height || 400 }}
      className="w-full border-0"
    />
  );
}

export default PostBody;
