import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import db from "./utils/db";

// Fallback for JWT_SECRET in case it's not defined in the environment
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");

export async function middleware(req: NextRequest) {
  // Admin path check
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = req.cookies.get("token")?.value;

    // If there's no token, redirect to login
    if (!token) return NextResponse.redirect(new URL("/login/admin", req.url));

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // If role is not "ketua", redirect to login
      if (payload.role !== "ketua") {
        return NextResponse.redirect(new URL("/login/admin", req.url));
      }

      // Proceed if everything checks out
      return NextResponse.next();
    } catch (err) {
      // Handle token verification failure (invalid or expired token)
      return NextResponse.redirect(new URL("/login/admin", req.url));
    }
  }

  // Regex to match any alphanumeric string of length 10 or more, like /R1m0dPWW5g
  const randomPathPattern = /^[a-zA-Z0-9]{10,}$/;

  // Check if the URL path matches the random alphanumeric pattern
  if (randomPathPattern.test(req.nextUrl.pathname.substring(1))) { 
    // Facebook crawler check
    if (req.headers.get('user-agent')?.includes('facebookexternalhit') || req.headers.get('user-agent')?.includes('Facebot')) {
    try {
      // Make a POST request to /api/postplay/check to retrieve the image URL based on the shortcode
      const response = await fetch(`https://generate.balanesohib.eu.org/api/postplay/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcode: req.nextUrl.pathname.substring(1) })
      });

      // Check if the response is valid
      if (!response.ok) {
        // If response is not OK (non-2xx status), handle the error gracefully
        console.error('Error fetching data from /api/postplay/check:', response.status);
        return NextResponse.next(); // Continue with the next middleware or request handler
      }

      // Parse the JSON response
      const data = await response.json();

      // If data contains the URL, redirect to the image
      if (data && data.img) {
        //return NextResponse.redirect(data.img, 302);
        const htmlContent = `
        <!DOCTYPE html>
          <html>
              <head>
                  <meta charset="UTF-8" />
                  <meta http-equiv="refresh" content="0;url='${data.img}'" />

                  <title>Redirecting to ${data.img}</title>
              </head>
              <body>
                  Redirecting to <a href="${data.img}">${data.img}</a>
          .
              </body>
          </html>
        `;
        return new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
    } catch (err) {
      console.error('Error in Facebook crawler request:', err);
      return NextResponse.next(); // Continue if there's an error in the fetch request
    }
  }

  // Default: continue to the next middleware or request handler
  return NextResponse.next();
  }

  // Default case: Continue if no pattern matched
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",  // Matches all paths
};
