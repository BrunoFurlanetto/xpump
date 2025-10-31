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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;
    const body = await request.json();

    console.log("🔄 Updating member:", {
      groupId: id,
      memberId,
      body,
    });

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/groups/${id}/members/${memberId}/`,
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
        error = { detail: errorText || "Error updating member" };
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("✅ Member updated successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 Error updating member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;

    console.log("🗑️ Removing member:", {
      groupId: id,
      memberId,
    });

    const response = await fetchWithTokenRefresh(
      `${BACKEND_URL}/groups/${id}/members/${memberId}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      },
      session
    );

    if (response.ok) {
      console.log("✅ Member removed successfully");
      return new NextResponse(null, { status: 204 });
    }

    const errorText = await response.text();
    console.error("❌ Backend error response:", errorText);

    let data;
    try {
      data = JSON.parse(errorText);
    } catch {
      data = { detail: errorText || "Error removing member" };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("💥 Error removing member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
