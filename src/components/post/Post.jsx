import { useState } from "react";
import Icon from "../Icon";
import VoteControls from "../VoteControls";
import pinIcon from "../../assets/pin.svg?raw";
import commentIcon from "../../assets/comment.svg?raw";

function Post({ post, onSelect }) {
  const [pinned, setPinned] = useState(post.pinned);

  return (
    <div
      onClick={() => onSelect?.(post)}
      className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Header row: title, author, pin */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate font-bold text-gray-900">{post.title}</h3>
          <span className="shrink-0 text-sm text-gray-500">{post.author}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPinned((p) => !p);
          }}
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

        <VoteControls score={post.voteScore} />
      </div>
    </div>
  );
}

export default Post;
