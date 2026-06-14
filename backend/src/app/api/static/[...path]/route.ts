import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

/**
 * GET /api/static/[...path]
 * Serve static files
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = path.join(process.cwd(), "public", ...resolvedParams.path);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "File not found" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const contentTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".json": "application/json",
      ".txt": "text/plain",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message ?? "Error serving file" },
      { status: 500 }
    );
  }
}
