import Modal from "@/components/ui/Modal";
import ShareTile from "./ShareTile";
import MoreShareMenu from "./MoreShareMenu";
import SharePreview from "./SharePreview";
import { mainProviders, moreProviders } from "@/lib/share/providers";
import { postUrl } from "@/lib/seo/seo";
import { useToast } from "@/lib/toast/toast";

// The share popup: a preview of the link card, then one tile per provider.
// The only share component that knows about the post - it builds the
// { url, title } target once and hands every provider the same `share`.
function ShareModal({ post, onClose }) {
  const showToast = useToast();
  const origin = window.location.origin;
  const target = { url: postUrl(post, origin), title: post.title };
  const share = (provider) => provider.activate(target, { showToast });

  return (
    <Modal onClose={onClose} title="Share this post" showClose className="max-w-md p-6">
      <SharePreview post={post} origin={origin} />
      <div className="mt-4 grid grid-cols-5 gap-2">
        {mainProviders.map((provider) => (
          <ShareTile key={provider.id} icon={provider.icon} label={provider.label} onClick={() => share(provider)} />
        ))}
        <MoreShareMenu providers={moreProviders} onSelect={share} />
      </div>
    </Modal>
  );
}

export default ShareModal;
