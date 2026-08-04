import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

// 只从环境变量读取；未配置时拒绝所有请求（防止公开仓库泄露默认密钥）
const SECRET = process.env.WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const sig = req.headers.get("x-hub-signature-256");
  const body = await req.text();

  // 必须携带 GitHub 签名，且 SECRET 必须已配置
  if (!SECRET || !sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 403 });
  }
  if (!sig.startsWith("sha256=")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = Buffer.from(sig.slice("sha256=".length), "hex");
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(body),
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
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
