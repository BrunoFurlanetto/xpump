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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";

    console.log("📥 GET Group by ID:", id, "period:", period);

    const url = period !== "all" ? `${BACKEND_URL}/groups/${id}/?period=${period}` : `${BACKEND_URL}/groups/${id}/`;

    const response = await fetchWithTokenRefresh(
      url,
      {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      },
      session
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Backend error response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { detail: errorText || "Error fetching group" };
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ Group fetched successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 Error fetching group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    console.log("🔄 Updating group:", { id, body });

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/groups/${id}/`,
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
      const errorText = await response.text();
      console.error("❌ Backend error response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { detail: errorText || "Error updating group" };
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ Group updated successfully:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 Error updating group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    console.log("🗑️ Deleting group:", { id });

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/groups/${id}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      },
      session
    );

    if (response.ok) {
      console.log("✅ Group deleted successfully");
      return new NextResponse(null, { status: 204 });
    }

    const errorText = await response.text();
    console.error("❌ Backend error response:", errorText);

    let data;
    try {
      data = JSON.parse(errorText);
    } catch {
      data = { detail: errorText || "Error deleting group" };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("💥 Error deleting group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
