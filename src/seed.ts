import { db } from "./db";
import { users } from "./db/schema";
import { hashPassword } from "./lib/auth";
import { eq } from "drizzle-orm";

async function seed() {
  const devEmail = "dev@notesapp.com";
  const devPassword = "dev123456";
  const devNickname = "Developer";

  const existing = await db.select().from(users).where(eq(users.email, devEmail));
  if (existing.length > 0) {
    console.log("⚡ Developer account already exists");
    return;
  }

  const hashedPassword = await hashPassword(devPassword);
  await db.insert(users).values({
    email: devEmail,
    nickname: devNickname,
    password: hashedPassword,
    role: "developer",
    isVerified: true,
  });

  console.log("⚡ Developer account created:");
  console.log(`   Email: ${devEmail}`);
  console.log(`   Password: ${devPassword}`);
}

seed().catch(console.error);
