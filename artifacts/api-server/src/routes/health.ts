import { Router, type IRouter } from "express";
import { GetAppConfigResponse, HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Tells the app whether real phone login is enforced. While it isn't, the
// app lets people continue without an OTP (e.g. before SMS is set up).
router.get("/config", (_req, res) => {
  res.json(GetAppConfigResponse.parse({ requireAuth: process.env["REQUIRE_AUTH"] === "true" }));
});

// Ops-only endpoint (not part of the client API spec): proves the server can
// actually reach the database behind DATABASE_URL. The db module is imported
// lazily so a missing/broken DATABASE_URL degrades this endpoint to a 503
// instead of crashing the whole server at boot.
router.get("/healthz/db", async (_req, res) => {
  try {
    const { pool } = await import("@workspace/db");
    const result = await pool.query("select version()");
    res.json({
      status: "ok",
      database: "connected",
      version: result.rows[0]?.version ?? "unknown",
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      database: "unreachable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
