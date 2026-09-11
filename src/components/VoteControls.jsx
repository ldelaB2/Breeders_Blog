import { useState } from "react";
import Icon from "./Icon";
import upvoteIcon from "../assets/upvote.svg?raw";
import downvoteIcon from "../assets/downvote.svg?raw";

// Shared upvote/downvote widget used by both posts and comments.
function VoteControls({ score: initialScore }) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState(0); // -1 down, 0 none, 1 up

  function castVote(direction) {
    const next = vote === direction ? 0 : direction;
    setScore(score - vote + next);
    setVote(next);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          castVote(1);
        }}
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
        onClick={(e) => {
          e.stopPropagation();
          castVote(-1);
        }}
        aria-label="Downvote"
        aria-pressed={vote === -1}
        className={`rounded-md p-1 text-red-600 transition-colors hover:bg-red-50 ${
          vote === -1 ? "bg-red-100" : ""
        }`}
      >
        <Icon svg={downvoteIcon} className="h-4 w-4" />
      </button>
    </div>
  );
}

export default VoteControls;
