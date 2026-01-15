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

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>, method: string) {
  try {
    const session = await verifySession(false);
    if (!session?.access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15+)
    const resolvedParams = await params;

    // Reconstruct the path
    const path = resolvedParams.path.join("/");

    // Django requires trailing slash for POST/PUT/PATCH/DELETE
    // Always ensure trailing slash to avoid APPEND_SLASH issues
    const pathWithSlash = path.endsWith("/") ? path : `${path}/`;

    // Get query params from the original request
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    // BACKEND_URL already includes /api/v1, so just append the path
    const backendUrl = `${BACKEND_URL}/${pathWithSlash}${queryString}`;

    console.log(`📥 ${method} request:`, {
      path,
      fullUrl: backendUrl,
    });

    // Prepare request options
    const headers: HeadersInit = {
      Authorization: `Bearer ${session.access}`,
    };

    // Handle body for POST, PUT, PATCH, DELETE
    let body: BodyInit | undefined;
    const contentType = request.headers.get("content-type");

    if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
      if (contentType?.includes("application/json")) {
        // For JSON requests
        headers["Content-Type"] = "application/json";
        const jsonBody = await request.json();
        body = JSON.stringify(jsonBody);
      } else if (contentType?.includes("multipart/form-data")) {
        // For FormData requests (file uploads)
        // Don't set Content-Type header, let fetch set it with boundary
        body = await request.formData();
      } else {
        // For other types, try to get the body
        const requestBody = await request.text();
        if (requestBody) {
          body = requestBody;
          if (contentType) {
            headers["Content-Type"] = contentType;
          }
        }
      }
    }

    console.log(body);
    const response = await fetchWithTokenRefresh(
      backendUrl,
      {
        method,
        headers,
        body,
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
        error = { detail: errorText || "Backend request failed" };
      }

      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, "GET");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, "POST");
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, "PUT");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, "DELETE");
}
