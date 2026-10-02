import FilePicker from "@/components/ui/FilePicker";

// A post's optional share image - the picture shown when its link is shared
// on LinkedIn, Facebook or X. Mirrors IMAGE_TYPES/MAX_IMAGE_BYTES in
// backend/src/config/limits.js so a bad file fails fast; the backend is the
// enforcement.
const RULES = {
  extensions: ["png", "jpg", "jpeg", "webp"],
  maxBytes: 5 * 1024 * 1024,
  typeLabel: "a .png, .jpg, or .webp image",
};
const HINT =
  "Shown when the post is shared on LinkedIn, Facebook or X. Landscape, ideally 1200×630. PNG, JPG or WebP, up to 5 MB.";

// FilePicker preset for the share image, used by CreatePostModal (the
// author's pick) and ApprovePostModal (the moderator's replacement).
function ShareImagePicker({ label = "Share image (optional)", ...props }) {
  return <FilePicker label={label} rules={RULES} hint={HINT} {...props} />;
}

export default ShareImagePicker;
