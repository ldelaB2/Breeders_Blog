// Shared Prisma `include` for loading a PostMetadata row with everything
// serializePost() needs. Pulled out so routes beyond posts.routes.js (e.g.
// the /me/pins and /me/recommendations routes) can query posts the same way.
export const postInclude = {
  votes: true,
  pins: true,
  body: true,
  _count: { select: { comments: { where: { deletedAt: null } } } },
};
