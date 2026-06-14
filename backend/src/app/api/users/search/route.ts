import type { NextRequest } from "next/server";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { getPool, sql } from "@/database/connection";

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const roleCheck = requireRoles(auth, ["Staff", "Admin", "Manager"]);
    if (roleCheck) return roleCheck;

    const query = req.nextUrl.searchParams.get("query");
    if (!query || query.trim().length < 2) {
      return successResponse([], "Nhập ít nhất 2 ký tự để tìm kiếm");
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("Query", sql.NVarChar(100), query.trim())
      .query(`
        SELECT TOP 10
          u.UserID AS userId,
          u.FullName AS fullName,
          u.Email AS email,
          u.PhoneNumber AS phone
        FROM Users u
        WHERE u.Status = 'Active'
          AND (u.PhoneNumber = @Query OR u.Email = @Query OR u.PhoneNumber LIKE '%' + @Query + '%')
        ORDER BY u.FullName ASC
      `);

    return successResponse(result.recordset, "Tìm kiếm khách hàng thành công");
  } catch (error) {
    return handleError(error);
  }
}
