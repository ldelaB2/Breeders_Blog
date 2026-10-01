// Groups a post's comments by parentId so each node can look up its replies
// in O(1); root-level comments live under key null.
export function buildChildrenMap(comments) {
  const map = new Map();
  comments.forEach((c) => {
    const siblings = map.get(c.parentId) || [];
    siblings.push(c);
    map.set(c.parentId, siblings);
  });
  return map;
}
