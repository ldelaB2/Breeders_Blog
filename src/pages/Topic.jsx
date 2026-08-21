// pages/Topic.jsx
import { useParams } from "react-router-dom";
import { DYNAMIC_TOPICS } from "../routes";

export default function Topic() {
  const { topic } = useParams();
  const match = DYNAMIC_TOPICS.find((t) => t.slug === topic);

  if (!match) return <div>Topic not found</div>;

  return (
    <div>
      <h1>{match.label}</h1>
      {/* render whatever content you want using match.slug or match.label */}
    </div>
  );
}
