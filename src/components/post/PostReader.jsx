import Icon from "./Icon";
import CommentSection from "./comment/CommentSection";
import Footer from "./Footer";
import backArrowIcon from "../assets/backarrow.svg?raw";

// Full-screen reader for a single post's HTML body. Rendered whenever a post
// is selected from the topic list, replacing that list until the user backs out.
function PostReader({ post, onBack }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-4 border-b border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to topic"
          className="shrink-0 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Icon svg={backArrowIcon} className="h-6 w-6" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-xl font-bold text-gray-900">{post.title}</h1>
          <p className="text-sm text-gray-500">{post.author}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="border-b border-gray-200 px-6 py-4 text-sm text-gray-600">
          {post.abstract}
        </p>

        {/* Sandboxed with no flags set: post HTML can't run scripts, submit
            forms, or access anything as this origin — it's untrusted content. */}
        <iframe
          title={post.title}
          srcDoc={post.body}
          sandbox=""
          className="h-[75vh] w-full border-0"
        />

        <CommentSection postId={post.id} />
        <Footer />
      </div>
    </div>
  );
}

export default PostReader;
