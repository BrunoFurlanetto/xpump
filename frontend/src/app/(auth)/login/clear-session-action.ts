"use server";

import { cookies } from "next/headers";

/**
 * Clear session cookie
 * This is a Server Action that can be called from Client Components
 */
export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return { success: true };
  } catch (error) {
    console.error("Error clearing session cookie:", error);
    return { success: false };
  }
}
