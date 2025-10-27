import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Route Handler to clear session cookie
 * This is used when we need to logout from a Server Component
 */
export async function POST() {
  try {
    (await cookies()).delete("session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing session:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
