const WIDTH = 600;
const HEIGHT = 480;

// Opens a platform's share-intent URL in a small centered popup, the way
// every "share to X" button on the web works: the link/title are
// pre-filled, but the already-logged-in user still clicks that platform's
// own post/share button themselves. `noopener,noreferrer` keeps the popup
// from getting a handle back to this page.
export function openSharePopup(url) {
  const left = window.screenX + (window.outerWidth - WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - HEIGHT) / 2;
  window.open(
    url,
    "share-popup",
    `width=${WIDTH},height=${HEIGHT},left=${left},top=${top},popup=yes,noopener,noreferrer`
  );
}
