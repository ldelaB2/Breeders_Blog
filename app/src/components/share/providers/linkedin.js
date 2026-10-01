import linkedinIcon from "../../../assets/linkedin.svg?raw";
import { postShareUrl } from "../lib/postShareUrl";
import { openSharePopup } from "../lib/openSharePopup";

const linkedin = {
  id: "linkedin",
  label: "LinkedIn",
  icon: linkedinIcon,
  kind: "popup",
  activate(post, origin) {
    const url = postShareUrl(post, origin);
    openSharePopup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
  },
};

export default linkedin;
