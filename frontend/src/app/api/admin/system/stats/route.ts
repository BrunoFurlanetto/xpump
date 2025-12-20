import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/constants";
import { verifySession, Session } from "@/lib/session";
import { updateTokenInCookies } from "@/app/(auth)/login/refresh-token-action";

async function fetchWithTokenRefresh(url: string, options: RequestInit, session: Session) {
  let response = await fetch(url, options);

  // If token expired, try to refresh
  if (response.status === 401 && session.refresh) {
    console.log("🔄 Token expired, attempting refresh...");

    const refreshResponse = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: session.refresh }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      if (data.access) {
        console.log("✅ Token refreshed successfully");

        // Update cookies with new token (keep same refresh token)
        await updateTokenInCookies(data.access, session.refresh);

        // Retry original request with new token
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${data.access}`,
          },
        };
        response = await fetch(url, newOptions);
      }
    }
  }

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/analytics/admin/system/stats/`,
      {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      },
      session
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Error fetching system stats" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
