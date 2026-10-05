import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { logger } from "../lib/logger";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; phone: string | null };
    }
  }
}

// Supabase Auth signs access tokens with keys published at the project's
// JWKS endpoint. SUPABASE_URL enables verification; without it (e.g. bare
// local dev) requests are simply treated as anonymous.
const supabaseUrl = process.env["SUPABASE_URL"]?.replace(/\/+$/, "");
const jwks = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

/**
 * Attaches `req.auth` when a valid Supabase access token is presented.
 * Invalid or missing tokens leave the request anonymous — endpoints decide
 * how much to trust anonymous callers (see requireAuthIfEnabled).
 */
export async function attachAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!jwks || !supabaseUrl || !header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const { payload } = await jwtVerify(header.slice("Bearer ".length), jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
    });
    req.auth = {
      userId: String(payload.sub),
      phone: typeof payload["phone"] === "string" ? payload["phone"] : null,
    };
  } catch (err) {
    logger.debug({ err }, "Rejected bearer token");
  }
  next();
}

/**
 * Blocks anonymous requests once REQUIRE_AUTH=true is set (the switch to
 * flip after the Supabase SMS provider is live and all users sign in for
 * real). Until then anonymous requests pass through, preserving demo mode.
 */
export function requireAuthIfEnabled(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (process.env["REQUIRE_AUTH"] === "true" && !req.auth) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  next();
}
