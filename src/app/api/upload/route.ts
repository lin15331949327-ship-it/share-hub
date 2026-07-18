import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  try {
    const json = await req.json();

    // Build token payload for client-side upload
    return NextResponse.json(
      await handleUpload({
        body: json,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          return {
            allowedContentTypes: [
              "image/jpeg", "image/png", "image/webp", "image/gif",
              "video/mp4", "video/webm", "video/ogg",
              "application/zip", "application/x-rar-compressed",
              "application/x-7z-compressed", "application/x-msdownload",
              "application/octet-stream",
            ],
            maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
            tokenPayload: JSON.stringify({ uploader: session.role }),
          };
        },
        onUploadCompleted: async ({ blob }) => {
          console.log(`[upload] ${session.role} uploaded: ${blob.url}`);
        },
      })
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 400 });
  }
}
