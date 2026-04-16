-- Replace the mutually-exclusive users.role enum with an is_admin boolean.
-- A user is now independently "admin or not" and "member of companies or not".
-- Every authenticated user can access /dashboard; only is_admin users can
-- access /admin.
ALTER TABLE "users" ADD COLUMN "is_admin" boolean NOT NULL DEFAULT false;
UPDATE "users" SET "is_admin" = true WHERE "role" = 'admin';
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "user_role";
