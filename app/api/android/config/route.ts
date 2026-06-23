import { NextResponse } from "next/server";
import { resolveAndroidTargetUrl } from "@/lib/android-app";

export async function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || undefined;
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const target = resolveAndroidTargetUrl(host?.split(":")[0], `${proto}:`);

  return NextResponse.json({
    appName: "EasySchool",
    ...target,
  });
}
