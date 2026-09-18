/*
  Warnings:

  - You are about to drop the column `htmlUpdatedAt` on the `PostBody` table. All the data in the column will be lost.
  - You are about to drop the column `rawContentType` on the `PostBody` table. All the data in the column will be lost.
  - You are about to drop the column `rawSize` on the `PostBody` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PostBody" DROP COLUMN "htmlUpdatedAt",
DROP COLUMN "rawContentType",
DROP COLUMN "rawSize";
