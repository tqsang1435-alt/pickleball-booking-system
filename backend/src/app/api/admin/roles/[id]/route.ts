import { NextRequest, NextResponse } from "next/server";
import {
  getRoleDetailController,
  updateRoleController,
  deleteRoleController,
} from "@/modules/roles/roles.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ message: "Invalid RoleID" }, { status: 400 });
    }
    return getRoleDetailController(req, roleId);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ message: "Invalid RoleID" }, { status: 400 });
    }
    return updateRoleController(req, roleId);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ message: "Invalid RoleID" }, { status: 400 });
    }
    return deleteRoleController(req, roleId);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
