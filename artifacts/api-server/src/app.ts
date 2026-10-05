import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { attachAuth } from "./middlewares/auth";
import { logger } from "./lib/logger";

const app: Express = express();

// Render terminates TLS at its proxy; trust it so client IPs (used by the
// rate limiter) come from X-Forwarded-For.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// ALLOWED_ORIGINS restricts CORS to a comma-separated list of origins in
// production; when unset, all origins are allowed (development default).
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : {}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic abuse protection: per-IP request budget across the API.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(attachAuth);

app.use("/api", router);

// Express 5 forwards rejected handler promises here; respond with JSON
// instead of the default HTML error page.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, "Unhandled request error");
  res.status(500).json({ message: "Internal server error" });
};
app.use(errorHandler);

export default app;
