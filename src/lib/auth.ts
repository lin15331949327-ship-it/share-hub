import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { compare, hash } from "./hash";
import type { SessionUser } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "share-hub-dev-secret-change-me-in-production"
);

const COOKIE_NAME = "share-hub-session";

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { role: payload.role as "admin" | "editor" };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(
  user: SessionUser,
  isSecure: boolean = false
): Promise<void> {
  const token = await signToken(user);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function requireAdmin(session: SessionUser | null): boolean {
  return session?.role === "admin";
}

export function requireLogin(session: SessionUser | null): boolean {
  return session !== null;
}
