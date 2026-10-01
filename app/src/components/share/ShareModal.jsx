import Modal from "@/components/ui/Modal";
import ShareProviderButton from "./ShareProviderButton";
import MoreShareMenu from "./MoreShareMenu";
import { shareProviders, VISIBLE_COUNT } from "@/lib/share/providers";
import { useToast } from "@/lib/toast/toast";

function ShareModal({ post, onClose }) {
  const showToast = useToast();
  const origin = window.location.origin;
  const visibleProviders = shareProviders.slice(0, VISIBLE_COUNT);
  const overflowProviders = shareProviders.slice(VISIBLE_COUNT);

  return (
    <Modal onClose={onClose} title="Share this post" subtitle={post.title} showClose className="max-w-md p-6">
      <div className="mt-2 grid grid-cols-5 gap-2">
        {visibleProviders.map((provider) => (
          <ShareProviderButton
            key={provider.id}
            provider={provider}
            post={post}
            origin={origin}
            showToast={showToast}
            variant="icon"
          />
        ))}
        <MoreShareMenu providers={overflowProviders} post={post} origin={origin} showToast={showToast} />
      </div>
    </Modal>
  );
}

export default ShareModal;
