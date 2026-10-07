import { NextResponse } from "next/server";
export function middleware(request){
  const {pathname}=request.nextUrl;
  if(pathname.startsWith("/api/") || pathname==="/login.html" || pathname.startsWith("/_next/")) return NextResponse.next();
  if(request.cookies.get("letmytrip_verified")?.value==="1") return NextResponse.next();
  const url=request.nextUrl.clone();
  url.pathname="/login.html";
  url.search="";
  return NextResponse.redirect(url);
}
export const config={matcher:["/:path*"]};
