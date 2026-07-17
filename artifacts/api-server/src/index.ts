import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * Applies pending SQL migrations and seeds the starter catalog on an empty
 * database. Failures are logged but non-fatal so the server still boots and
 * /api/healthz/db can report the underlying problem.
 */
async function prepareDatabase(): Promise<void> {
  if (!process.env["DATABASE_URL"]) {
    logger.warn(
      "DATABASE_URL is not set — skipping migrations; database-backed routes will fail",
    );
    return;
  }

  try {
    const { db } = await import("@workspace/db");
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "migrations"),
    });
    const { seedIfEmpty } = await import("@workspace/db/seed");
    const seeded = await seedIfEmpty();
    logger.info({ seeded }, "Database migrations applied");
  } catch (err) {
    logger.error(
      { err },
      "Database preparation failed — database-backed routes will fail",
    );
  }
}

prepareDatabase().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
