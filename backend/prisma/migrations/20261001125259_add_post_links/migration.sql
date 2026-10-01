-- CreateTable
CREATE TABLE "PostLink" (
    "sourcePostId" TEXT NOT NULL,
    "targetPostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLink_pkey" PRIMARY KEY ("sourcePostId","targetPostId")
);

-- CreateIndex
CREATE INDEX "PostLink_targetPostId_idx" ON "PostLink"("targetPostId");

-- AddForeignKey
ALTER TABLE "PostLink" ADD CONSTRAINT "PostLink_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "PostMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLink" ADD CONSTRAINT "PostLink_targetPostId_fkey" FOREIGN KEY ("targetPostId") REFERENCES "PostMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defence in depth, matching 20260923125241_enable_rls: nothing in this app
-- talks to Supabase's Data API, and DATABASE_URL/DIRECT_URL connect as the
-- `postgres` role (BYPASSRLS, owns this table), so this has no effect on the
-- app. No policies on purpose - authorization lives in Express
-- (requireAuth / requireRole in src/middleware/requireAuth.js).
ALTER TABLE "PostLink" ENABLE ROW LEVEL SECURITY;
