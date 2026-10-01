import redditIcon from "../../../assets/reddit.svg?raw";
import { postShareUrl } from "../lib/postShareUrl";
import { openSharePopup } from "../lib/openSharePopup";

const reddit = {
  id: "reddit",
  label: "Reddit",
  icon: redditIcon,
  kind: "popup",
  activate(post, origin) {
    const url = postShareUrl(post, origin);
    openSharePopup(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(post.title)}`);
  },
};

export default reddit;
