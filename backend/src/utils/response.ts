import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function successResponse<T>(
  data: T,
  message = "Success",
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { 
      status,
      headers: corsHeaders
    }
  );
}

export function errorResponse(message = "Error", status = 500, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { 
      status,
      headers: corsHeaders
    }
  );
}