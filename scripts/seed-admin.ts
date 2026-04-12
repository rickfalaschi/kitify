import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hash } from "bcryptjs";
import { users } from "../src/db/schema/users";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const passwordHash = await hash("admin123", 12);

  const [admin] = await db
    .insert(users)
    .values({
      name: "Administrador",
      email: "admin@kits.com",
      passwordHash,
      role: "admin",
    })
    .returning();

  console.log("Admin criado:", admin.email);
}

main().catch(console.error);
