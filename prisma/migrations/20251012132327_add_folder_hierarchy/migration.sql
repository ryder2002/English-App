/*
  Warnings:

  - A unique constraint covering the columns `[name,user_id,parent_id]` on the table `folders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."folders_name_user_id_key";

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "parent_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "folders_name_user_id_parent_id_key" ON "folders"("name", "user_id", "parent_id");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
