import copyLinkIcon from "../../../assets/copy_link.svg?raw";
import { postShareUrl } from "../lib/postShareUrl";

const copyLink = {
  id: "copy-link",
  label: "Copy link",
  icon: copyLinkIcon,
  kind: "action",
  async activate(post, origin, { showToast }) {
    try {
      await navigator.clipboard.writeText(postShareUrl(post, origin));
      showToast("Link copied!");
    } catch {
      showToast("Couldn't copy link");
    }
  },
};

export default copyLink;
