import { ZodError } from "zod";
import { errorResponse } from "@/utils/response";

export function handleError(error: unknown) {
  console.error(error);

  if (error instanceof ZodError) {
    return errorResponse("Dữ liệu không hợp lệ", 400, error.flatten());
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse("Lỗi hệ thống", 500);
}