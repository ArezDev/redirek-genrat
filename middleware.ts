import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import db from "./utils/db";

// Fallback for JWT_SECRET in case it's not defined in the environment
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");

export async function middleware(req: NextRequest, res: NextResponse) {
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
    // if (req.headers.get('user-agent')?.includes('facebookexternalhit') || req.headers.get('user-agent')?.includes('Facebot')) {
    // try {
    //   // Make a POST request to /api/postplay/check to retrieve the image URL based on the shortcode
    //   const response = await fetch(`https://generate.balanesohib.eu.org/api/postplay/check`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ shortcode: req.nextUrl.pathname.substring(1) })
    //   });

    //   // Check if the response is valid
    //   if (!response.ok) {
    //     // If response is not OK (non-2xx status), handle the error gracefully
    //     console.error('Error fetching data from /api/postplay/check:', response.status);
    //     return NextResponse.next(); // Continue with the next middleware or request handler
    //   }

    //   // Parse the JSON response
    //   const data = await response.json();
    //   const target = data.img;

    //   // If data contains the URL, redirect to the image
    //   if (data && target) {
    //     const html = `
    //       <!DOCTYPE html>
    //       <html>
    //         <head>
    //           <meta charset="UTF-8" />
    //           <meta http-equiv="refresh" content="0;url='${target}'" />
    //           <title>Redirecting...</title>
    //         </head>
    //         <body>
    //           Redirecting to <a href="${target}">${target}</a>
    //         </body>
    //       </html>`.trim();

    //     // Return HTML with meta refresh for Facebook crawler
    //     return new Response(html, {
    //       status: 302,
    //       headers: {
    //         'Content-Type': 'text/html; charset=utf-8',
    //         'Cache-Control': 'no-cache, private',
    //         'Location': target,
    //       },
    //     });
    //   }

    //   // Fetch the image to ensure it's accessible
    //   const res = await fetch(target);
    //   const buffer = await res.arrayBuffer();
    //   const contentType = res.headers.get("content-type") || "image/jpeg";
    //   return new Response(buffer, {
    //     status: 200,
    //     headers: {
    //       "Content-Type": contentType,
    //       "Content-Length": buffer.byteLength.toString(),
    //       "Cache-Control": "public, max-age=3600",
    //     },
    //   });

    // } catch (err) {
    //   console.error('Error in Facebook crawler request:', err);
    //   return NextResponse.next(); // Continue if there's an error in the fetch request
    // }
    // }

    // Regular user request handling
    const ua = req.headers.get("user-agent") || "";
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
      const target = data.img;

      // Kalau crawler → kasih HTML + 302
      if (/facebookexternalhit/i.test(ua)) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta http-equiv="refresh" content="0;url='${target}'" />
              <title>Redirecting...</title>
            </head>
            <body>
              Redirecting to <a href="${target}">${target}</a>
            </body>
          </html>`.trim();
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, private',
            'Location': target,
          },
        });
      }
      const res = await fetch(target);
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "image/jpeg";
      return new Response(buffer, {
        status: 302,
        headers: {
          "Content-Type": contentType,
          "Content-Length": buffer.byteLength.toString(),
          "Cache-Control": "public, max-age=3600"
        },
      });

      // Kalau user biasa → fetch dan kirim binary image
      // const res = await fetch(target);
      // const buffer = await res.arrayBuffer();
      // const contentType = res.headers.get("content-type") || "image/jpeg";

      // return new Response(buffer, {
      //   status: 200,
      //   headers: {
      //     "Content-Type": contentType,
      //     "Content-Length": buffer.byteLength.toString(),
      //     "Cache-Control": "public, max-age=3600",
      //     "Location": target,
      //   },
      // });

    } catch (err) {
      console.error('Error in Facebook crawler request:', err);
      return NextResponse.next(); // Continue if there's an error in the fetch request
    }

  }

  // Default case: Continue if no pattern matched
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",  // Matches all paths
};
