import { NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/jwt";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    await verifyDownloadToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const filePath = path.join(process.cwd(), "public", "downloads", "ultimate-ai-business-starter.txt");
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const file = fs.readFileSync(filePath);
  const headers = new Headers();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Content-Disposition", 'attachment; filename="AI-Business-Starter-Kit.txt"');

  return new NextResponse(file, { headers });
}