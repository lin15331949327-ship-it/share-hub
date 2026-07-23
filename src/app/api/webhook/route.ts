import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

const SECRET = process.env.WEBHOOK_SECRET || "sharehub-deploy-2026";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("x-hub-signature-256");
  const body = await req.text();

  // Verify GitHub signature
  if (sig) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sigBytes = Buffer.from(sig.replace("sha256=", ""), "hex");
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(body));
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const event = req.headers.get("x-github-event");
  if (event !== "push") return NextResponse.json({ ok: true, skipped: true });

  // Deploy in background — don't block the response
  exec("cd /home/admin/share-hub && git pull && npm install --prefer-offline 2>&1 | tail -1 && npm run build 2>&1 | tail -3 && sudo systemctl restart share-hub", (err, stdout) => {
    if (err) console.error("[webhook] FAIL:", err.message);
    else console.log("[webhook] OK", stdout);
  });

  return NextResponse.json({ ok: true });
}
