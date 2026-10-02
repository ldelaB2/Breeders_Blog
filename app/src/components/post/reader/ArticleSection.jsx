// A titled block below a post's body (Linked Posts, Comments), separated
// from what's above by a rule. `action` sits beside the heading (e.g. the
// add-comment button).
function ArticleSection({ title, action, children }) {
  return (
    <section className="border-t border-gray-200 px-6 py-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default ArticleSection;
