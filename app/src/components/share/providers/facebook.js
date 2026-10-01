import facebookIcon from "../../../assets/facebook.svg?raw";
import { postShareUrl } from "../lib/postShareUrl";
import { openSharePopup } from "../lib/openSharePopup";

const facebook = {
  id: "facebook",
  label: "Facebook",
  icon: facebookIcon,
  kind: "popup",
  activate(post, origin) {
    const url = postShareUrl(post, origin);
    openSharePopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  },
};

export default facebook;
