import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Handle static file serving for /images/* and /uploads/*
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  const pathArray = params.path as string[];
  
  if (!pathArray) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = pathArray.join("/");

  // Only serve files from public directories
  if (!filePath.startsWith("images/") && !filePath.startsWith("uploads/")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const fullPath = path.join(process.cwd(), "public", filePath);

  try {
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(fullPath);
    
    // Determine MIME type based on extension
    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = "application/octet-stream";
    
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    };
    
    mimeType = mimeTypes[ext] || mimeType;

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": mimeType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(`Error serving file ${filePath}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
