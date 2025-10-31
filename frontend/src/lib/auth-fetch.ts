import "server-only";
import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { verifySession } from "./session";
import { BACKEND_URL } from "./constants";

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
    throw new AuthError("Sessão inválida, por favor faça login novamente.", true);
  }

  options.headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access}`,
  };

  let response = await fetch(url, options);
  // If we get a 401, try to refresh the token before redirecting
  if (response.status === 401 && session.refresh) {
    console.log("🔄 [authFetch] Token expirado (401), tentando renovar...");

    const refreshResponse = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: session.refresh }),
    });

    console.log("📥 [authFetch] Resposta do refresh - Status:", refreshResponse.status);

    if (!refreshResponse.ok) {
      console.error("❌ [authFetch] Falha ao renovar token");
      throw new AuthError("Sessão inválida, por favor faça login novamente.", true);
    }

    const data = await refreshResponse.json();

    if (!data.access) {
      console.error("❌ [authFetch] Resposta não contém access token");
      throw new AuthError("Sessão inválida, por favor faça login novamente.", true);
    }

    options.headers.Authorization = `Bearer ${data.access}`;
    response = await fetch(url, options);

    console.log("📥 [authFetch] Resposta da requisição reenviada - Status:", response.status);

    if (response.status === 401) {
      console.error("❌ [authFetch] Ainda recebeu 401 após renovar token");
      throw new AuthError("Sessão inválida, por favor faça login novamente.", true);
    }
  } else if (response.status === 401) {
    throw new AuthError("Sessão inválida, por favor faça login novamente.", true);
  }

  return response;
};
