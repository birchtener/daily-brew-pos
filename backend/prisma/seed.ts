import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting system seeding initialization...");

  const adminUsername = "master";
  const rawPassword = "123456";

  const existingUser = await prisma.user.findFirst({
    where: { username: adminUsername },
  });

  if (existingUser) {
    console.log("Seed skipped: A root administrative account already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  const rootAdmin = await prisma.user.create({
    data: {
      first_name: "Master",
      last_name: "Account",
      username: adminUsername,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`Success: Root administrator provisioned successfully.`);
  console.log(`Username: ${rootAdmin.username}`);
  console.log(`Password: ${rawPassword}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });