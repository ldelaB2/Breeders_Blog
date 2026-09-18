/*
  Warnings:

  - You are about to drop the column `rawMd` on the `PostBody` table. All the data in the column will be lost.
  - Added the required column `rawContentType` to the `PostBody` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawOriginalName` to the `PostBody` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawSize` to the `PostBody` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawSlug` to the `PostBody` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PostBody" DROP COLUMN "rawMd",
ADD COLUMN     "rawContentType" TEXT NOT NULL,
ADD COLUMN     "rawOriginalName" TEXT NOT NULL,
ADD COLUMN     "rawSize" INTEGER NOT NULL,
ADD COLUMN     "rawSlug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PendingPostUpload" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rawSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingPostUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingPostUpload_authorId_idx" ON "PendingPostUpload"("authorId");
