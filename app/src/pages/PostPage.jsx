import { useParams, useNavigate } from "react-router-dom";
import PostReader from "@/components/post/reader/PostReader";

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <PostReader postId={id} onBack={() => navigate(-1)} />;
}
