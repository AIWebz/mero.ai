import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;
  const isProtected = pathname.startsWith("/app");

  if (isProtected && !isAuthed) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/app/:path*"],
};
