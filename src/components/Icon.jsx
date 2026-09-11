// Inlines a static, build-time SVG file's markup as a real DOM element so it
// can be colored with currentColor. Safe here because the source is a fixed
// asset file, never user-controlled data.
function Icon({ svg, className }) {
  return (
    <span
      aria-hidden="true"
      className={`block [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default Icon;
