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

const authRequired = () => process.env["REQUIRE_AUTH"] === "true";

/**
 * Phones arrive in mixed formats ("+919876543210" from Supabase Auth,
 * "9876543210" from the app). Compare and store by the last 10 digits.
 */
export const normalizePhone = (p: string) => p.replace(/\D/g, "").slice(-10);

/**
 * The caller's phone (normalized), or null if unknown. A verified token
 * always wins. Before real SMS login is live (REQUIRE_AUTH off), the app's
 * signed-in phone is accepted from the X-Demo-Phone header so shopkeeper
 * flows can be exercised end to end; that header is ignored once
 * REQUIRE_AUTH=true.
 */
export function callerPhone(req: Request): string | null {
  if (req.auth?.phone) return normalizePhone(req.auth.phone);
  if (authRequired()) return null;
  const demo = req.header("x-demo-phone");
  return demo && normalizePhone(demo).length === 10 ? normalizePhone(demo) : null;
}

/**
 * Who may manage a shop's products and orders: its registered owner. The
 * seeded demo shops have no owner and stay open to everyone only until
 * REQUIRE_AUTH is switched on.
 */
export function canManageShop(shop: { ownerPhone: string | null }, req: Request): boolean {
  if (shop.ownerPhone) return callerPhone(req) === shop.ownerPhone;
  return !authRequired();
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
  if (authRequired() && !req.auth) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  next();
}
