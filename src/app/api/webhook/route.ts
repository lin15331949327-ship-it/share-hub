import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

const SECRET = process.env.WEBHOOK_SECRET || "sharehub-deploy-2026";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("x-hub-signature-256");
  const body = await req.text();

  // Verify signature
  if (sig) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, hexToBytes(sig.replace("sha256=", "")), encoder.encode(body));
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const event = req.headers.get("x-github-event");
  if (event !== "push") return NextResponse.json({ ok: true, skipped: true });

  // Run deploy in background
  exec("cd /home/admin/share-hub && git pull && npm install --prefer-offline 2>&1 | tail -1 && npm run build 2>&1 | tail -3 && sudo systemctl restart share-hub", (err, stdout) => {
    console.log("[webhook] deploy:", err ? `FAIL: ${err.message}` : "OK");
    if (stdout) console.log("[webhook]", stdout);
  });

  return NextResponse.json({ ok: true });
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  return bytes;
}
