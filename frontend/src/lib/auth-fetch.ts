import "server-only";
import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { verifySession, updateToken, deleteSession } from "./session";
import { BACKEND_URL } from "./constants";
import { redirect } from "next/navigation";

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export class AuthError extends Error {
  constructor(message: string, public shouldLogout = false) {
    super(message);
    this.name = "AuthError";
  }
}

export const authFetch = async (url: string | URL, options: FetchOptions = {}) => {

  const session = await verifySession(false);

  if (!session?.access) {
    console.error("❌ Sessão não encontrada ou sem access token - redirecionando para login");
    redirect("/login");
  }

  options.headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access}`,
  };

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new AuthError("Erro ao fazer requisição", true);
  }

  // If we get a 401, try to refresh the token before redirecting
  if (response.status === 401 && session.refresh) {
    try {
      const refreshResponse = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: session.refresh }),
      });

      if (!refreshResponse.ok) {
        redirect("/login");
      }

      const data = await refreshResponse.json();

      if (!data.access) {
        redirect("/login");
      }


      // Update the token in cookies
      await updateToken({
        accessToken: data.access,
        refreshToken: session.refresh,
      });

      options.headers.Authorization = `Bearer ${data.access}`;
      response = await fetch(url, options);

      if (response.status === 401) {
        redirect("/login");
      }

    } catch {
      redirect("/login");
    }
  } else if (response.status === 401) {
    redirect("/login");
  }

  return response;
};
