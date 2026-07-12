import { createMiddleware } from '@frontman-ai/nextjs';
import { NextRequest, NextResponse } from 'next/server';

const frontman = createMiddleware({
  host: 'api.frontman.sh',
});

export async function middleware(req: NextRequest) {
  const response = await frontman(req);
  if (response) return response;
  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/frontman', '/frontman/:path*', '/:path*/frontman', '/:path*/frontman/'],
};
