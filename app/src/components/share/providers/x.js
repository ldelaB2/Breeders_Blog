import xIcon from "../../../assets/x.svg?raw";
import { postShareUrl } from "../lib/postShareUrl";
import { openSharePopup } from "../lib/openSharePopup";

const x = {
  id: "x",
  label: "X",
  icon: xIcon,
  kind: "popup",
  activate(post, origin) {
    const url = postShareUrl(post, origin);
    openSharePopup(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`);
  },
};

export default x;
