import Modal from "../../Modal";
import { useToast } from "../../../lib/useToast";
import { shareProviders, VISIBLE_COUNT } from "../providers";
import ShareProviderButton from "./ShareProviderButton";
import MoreShareMenu from "./MoreShareMenu";

function ShareModal({ post, onClose }) {
  const showToast = useToast();
  const origin = window.location.origin;
  const visibleProviders = shareProviders.slice(0, VISIBLE_COUNT);
  const overflowProviders = shareProviders.slice(VISIBLE_COUNT);

  return (
    <Modal onClose={onClose} className="max-w-md p-6">
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute left-0 top-0 rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="pt-8 text-center">
          <h2 className="text-lg font-bold text-gray-900">Share this post</h2>
          <p className="mt-1 truncate text-sm text-gray-600">{post.title}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-2">
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
