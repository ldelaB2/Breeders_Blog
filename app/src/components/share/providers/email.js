import emailIcon from "../../../assets/email.svg?raw";
import { postShareUrl } from "../lib/postShareUrl";

const email = {
  id: "email",
  label: "Email",
  icon: emailIcon,
  kind: "action",
  activate(post, origin) {
    const url = postShareUrl(post, origin);
    window.location.href = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(url)}`;
  },
};

export default email;
