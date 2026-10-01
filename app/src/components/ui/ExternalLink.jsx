// A link to another site; always opens in a new tab.
function ExternalLink({ href, className = "underline", children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export default ExternalLink;
