import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { verifySession } from "./session";

export type VerifySessionType = Awaited<ReturnType<typeof verifySession>>;
export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  skipRefresh?: boolean; // Para evitar loops infinitos
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
    throw new AuthError("Sessão não encontrada", true);
  }

  options.headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access}`,
  };

  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    console.error("Erro na requisição fetch:", error, url, options);
    throw new AuthError("Erro ao fazer requisição", true);
  }

  // If we get a 401, just throw an error instead of trying to refresh
  // Token refresh should happen in Server Actions, not during rendering
  if (response.status === 401) {
    throw new AuthError("Token expirado ou inválido", true);
  }

  return response;
};
