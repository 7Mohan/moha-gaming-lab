import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function GET(request: Request) {
  await destroySession();
  const url = new URL("/admin/login", request.url);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  await destroySession();
  const url = new URL("/admin/login", request.url);
  return NextResponse.redirect(url);
}
