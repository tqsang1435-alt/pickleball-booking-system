import { NextRequest } from "next/server";
import { markMessagesAsReadController } from "@/modules/playgroups/playgroups.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const groupId = parseInt(resolvedParams.id, 10);
  if (isNaN(groupId)) {
    return new Response(
      JSON.stringify({ success: false, message: "ID không hợp lệ" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  return markMessagesAsReadController(req, groupId);
}
