import { postSeo, SITE_IMAGE_PATH, SITE_NAME } from "@/lib/seo/seo";

// A mock of the link-preview card a shared post unfurls as. It reads the
// same postSeo values api/post.js writes into the og:/twitter: tags, so the
// two can't drift: a post with a share image gets the large-image card
// (summary_large_image), one without gets the compact logo card (summary).
function SharePreview({ post, origin }) {
  const { title, description, image } = postSeo(post, origin);
  // Previews label the card with the bare domain, not the full link.
  const domain = new URL(origin).hostname.replace(/^www\./, "");

  const text = (
    <div className="min-w-0 px-3 py-2">
      <p className="truncate text-xs uppercase text-gray-500">{domain}</p>
      <p className="line-clamp-2 text-sm font-semibold text-gray-900">{title}</p>
      <p className="line-clamp-2 text-xs text-gray-600">{description}</p>
    </div>
  );

  if (image) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <img src={image} alt={title} className="aspect-[1.91/1] w-full border-b border-gray-200 object-cover" />
        {text}
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <img
        src={`${origin}${SITE_IMAGE_PATH}`}
        alt={`${SITE_NAME} logo`}
        className="w-24 shrink-0 border-r border-gray-200 bg-white object-contain p-2"
      />
      {text}
    </div>
  );
}

export default SharePreview;
