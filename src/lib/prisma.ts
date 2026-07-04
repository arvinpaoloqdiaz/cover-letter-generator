import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

let prisma: PrismaClient;

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set in environment variables");
  }

  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname || "localhost";
    const port = parsed.port ? parseInt(parsed.port) : 3306;
    const user = parsed.username || "root";
    const password = parsed.password ? decodeURIComponent(parsed.password) : "";
    const database = parsed.pathname ? parsed.pathname.replace(/^\//, "") : "cover_letter_generator";

    const adapter = new PrismaMariaDb({
      host,
      port,
      user,
      password,
      database,
      connectionLimit: 10,
    });

    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Failed to parse DATABASE_URL, falling back to default Laragon credentials:", error);
    const adapter = new PrismaMariaDb({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "cover_letter_generator",
      connectionLimit: 10,
    });
    return new PrismaClient({ adapter });
  }
}

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = createPrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;
