import { useState } from "react";
import pinIcon from "../assets/pin.svg?raw";
import commentIcon from "../assets/comment.svg?raw";
import upvoteIcon from "../assets/upvote.svg?raw";
import downvoteIcon from "../assets/downvote.svg?raw";

// Inlines a static, build-time SVG file's markup as a real DOM element so it
// can be colored with currentColor. Safe here because the source is a fixed
// asset file, never user-controlled data.
function Icon({ svg, className }) {
  return (
    <span
      aria-hidden="true"
      className={`block [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Post({ post }) {
  const [pinned, setPinned] = useState(post.pinned);
  const [score, setScore] = useState(post.voteScore);
  const [vote, setVote] = useState(0); // -1 down, 0 none, 1 up

  function castVote(direction) {
    const next = vote === direction ? 0 : direction;
    setScore(score - vote + next);
    setVote(next);
  }

  return (
    <div className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header row: title, author, pin */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate font-bold text-gray-900">{post.title}</h3>
          <span className="shrink-0 text-sm text-gray-500">{post.author}</span>
        </div>

        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          aria-label={pinned ? "Unpin post" : "Pin post"}
          aria-pressed={pinned}
          className={`shrink-0 rounded-md p-1.5 transition-colors hover:bg-gray-100 ${
            pinned ? "text-amber-500" : "text-gray-300"
          }`}
        >
          <Icon svg={pinIcon} className="h-5 w-5" />
        </button>
      </div>

      {/* Abstract: clamped to a couple lines, expands on hover */}
      <div className="mt-3 max-h-10 overflow-hidden transition-[max-height] duration-400 ease-in-out group-hover:max-h-40 group-hover:overflow-y-auto">
        <p className="line-clamp-2 text-sm text-gray-600 group-hover:line-clamp-none">
          {post.abstract}
        </p>
      </div>

      {/* Footer row: comments bottom left, vote controls bottom right */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500">
          <Icon svg={commentIcon} className="h-4 w-4" />
          <span>{post.comment}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => castVote(1)}
            aria-label="Upvote"
            aria-pressed={vote === 1}
            className={`rounded-md p-1 text-green-600 transition-colors hover:bg-green-50 ${
              vote === 1 ? "bg-green-100" : ""
            }`}
          >
            <Icon svg={upvoteIcon} className="h-4 w-4" />
          </button>

          <span className="min-w-[2ch] text-center font-medium text-gray-700">
            {score}
          </span>

          <button
            type="button"
            onClick={() => castVote(-1)}
            aria-label="Downvote"
            aria-pressed={vote === -1}
            className={`rounded-md p-1 text-red-600 transition-colors hover:bg-red-50 ${
              vote === -1 ? "bg-red-100" : ""
            }`}
          >
            <Icon svg={downvoteIcon} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Post;
