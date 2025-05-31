// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) return NextResponse.redirect(new URL("/login/admin", req.url));

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.role !== "ketua") {
      return NextResponse.redirect(new URL("/login/admin", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL("/login/admin", req.url));
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};