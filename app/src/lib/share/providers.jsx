// A share target is plain data: { id, label, icon (an <Icon> name),
// activate(target, { showToast }) }, where `target` is the post's
// { url, title } (built once by ShareModal). The share components render
// any of them, so adding a platform is one entry in the list below.

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 480;

// Opens a platform's share-intent URL in a small centered popup, the way
// every "share to X" button on the web works: the link/title are
// pre-filled, but the already-logged-in user still clicks that platform's
// own post/share button themselves. `noopener,noreferrer` keeps the popup
// from getting a handle back to this page.
function openSharePopup(url) {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
  window.open(
    url,
    "share-popup",
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=yes,noopener,noreferrer`,
  );
}

// Platforms that share through a pre-filled web intent URL in a popup.
// `intentUrl` receives the post's (unencoded) link and title.
function popupProvider({ id, label, icon, intentUrl }) {
  return {
    id,
    label,
    icon,
    activate({ url, title }) {
      openSharePopup(intentUrl(url, title));
    },
  };
}

const enc = encodeURIComponent;

const copyLink = {
  id: "copy-link",
  label: "Copy link",
  icon: "copy-link",
  async activate({ url }, { showToast }) {
    try {
      await navigator.clipboard.writeText(url);
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
  activate({ url, title }) {
    window.location.href = `mailto:?subject=${enc(title)}&body=${enc(url)}`;
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

// Order matters: the first MAIN_COUNT render as tiles in the share modal's
// main row (MAIN_COUNT + the "More" tile fill its 5 columns); the rest live
// under the "More" menu.
const PROVIDERS = [copyLink, facebook, email, reddit, x, linkedin];
const MAIN_COUNT = 4;

export const mainProviders = PROVIDERS.slice(0, MAIN_COUNT);
export const moreProviders = PROVIDERS.slice(MAIN_COUNT);
