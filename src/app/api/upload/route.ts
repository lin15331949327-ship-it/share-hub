import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { filename, contentType, size } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    const result = await getPresignedUploadUrl(filename, contentType, size || 0);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === "Login required") {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
