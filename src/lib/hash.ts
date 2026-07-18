/**
 * Simple salted hash using Web Crypto API.
 * Avoids bcrypt native dependency issues on Windows / Vercel Edge.
 */

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hash(password: string): Promise<string> {
  const salt = crypto.randomUUID();
  const h = await sha256(salt + password);
  return `${salt}:${h}`;
}

export async function compare(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, original] = storedHash.split(":");
  const h = await sha256(salt + password);
  return h === original;
}
