import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/constants";
import { verifySession, Session } from "@/lib/session";
import { updateTokenInCookies } from "@/app/(auth)/login/refresh-token-action";

async function fetchWithTokenRefresh(url: string, options: RequestInit, session: Session) {
  let response = await fetch(url, options);

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
        await updateTokenInCookies(data.access, session.refresh);

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    console.log("👋 Leaving group:", { groupId: id });

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/groups/${id}/quiting/`,
      {
        method: "POST",
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
        error = { detail: errorText || "Error leaving group" };
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ Left group successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 Error leaving group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
