import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/constants";
import { verifySession } from "@/lib/session";
import { updateTokenInCookies } from "@/app/(auth)/login/refresh-token-action";

async function fetchWithTokenRefresh(url: string, options: RequestInit, session: any) {
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/workouts/${params.id}/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      session
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Error updating workout" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating workout:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/workouts/${params.id}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      },
      session
    );

    if (response.ok) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({ detail: "Error deleting workout" }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
