import { postUrl } from "@/lib/seo/seo";
import { openSharePopup } from "./openSharePopup";

// A share target is plain data: { id, label, icon (an <Icon> name),
// activate(post, origin, { showToast }) }. ShareProviderButton renders any
// of them, so adding a platform is one entry in the list below.

// Platforms that share through a pre-filled web intent URL in a popup.
// `intentUrl` receives the post's (unencoded) link and title.
function popupProvider({ id, label, icon, intentUrl }) {
  return {
    id,
    label,
    icon,
    activate(post, origin) {
      openSharePopup(intentUrl(postUrl(post, origin), post.title));
    },
  };
}

const enc = encodeURIComponent;

const copyLink = {
  id: "copy-link",
  label: "Copy link",
  icon: "copy-link",
  async activate(post, origin, { showToast }) {
    try {
      await navigator.clipboard.writeText(postUrl(post, origin));
      showToast("Link copied!");
    } catch {
      showToast("Couldn't copy link");
    }
  },
};

const email = {
  id: "email",
  label: "Email",
  icon: "email",
  activate(post, origin) {
    window.location.href = `mailto:?subject=${enc(post.title)}&body=${enc(postUrl(post, origin))}`;
  },
};

const facebook = popupProvider({
  id: "facebook",
  label: "Facebook",
  icon: "facebook",
  intentUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
});

const reddit = popupProvider({
  id: "reddit",
  label: "Reddit",
  icon: "reddit",
  intentUrl: (url, title) => `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
});

const x = popupProvider({
  id: "x",
  label: "X",
  icon: "x-logo",
  intentUrl: (url, title) => `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
});

const linkedin = popupProvider({
  id: "linkedin",
  label: "LinkedIn",
  icon: "linkedin",
  intentUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
});

// Order matters: the first VISIBLE_COUNT providers render as icons in the
// share modal's main row, the rest live under the "More" popover.
export const shareProviders = [copyLink, facebook, email, reddit, x, linkedin];
export const VISIBLE_COUNT = 4;
