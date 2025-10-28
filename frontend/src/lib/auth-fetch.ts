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

/**
 * Authenticated fetch for Server Components (with automatic token refresh)
 * Use this when calling from Server Components during rendering
 * If token is expired, will try to refresh before redirecting to login
 */
export const authFetch = async (url: string | URL, options: FetchOptions = {}) => {
  console.log("🔐 authFetch - Iniciando requisição para:", url.toString());

  const session = await verifySession(false);

  if (!session?.access) {
    console.error("❌ Sessão não encontrada ou sem access token - redirecionando para login");
    redirect("/login");
  }

  console.log("✅ Sessão encontrada, user_id:", session.user_id);

  options.headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access}`,
  };

  let response;
  try {
    console.log("📤 Fazendo requisição...");
    response = await fetch(url, options);
    console.log("📥 Resposta recebida - Status:", response.status);
  } catch (error) {
    console.error("❌ Erro na requisição fetch:", error, "URL:", url.toString());
    throw new AuthError("Erro ao fazer requisição", true);
  }

  // If we get a 401, try to refresh the token before redirecting
  if (response.status === 401 && session.refresh) {
    console.log("🔄 Token expirado, tentando renovar...");

    try {
      const refreshResponse = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: session.refresh }),
      });

      if (!refreshResponse.ok) {
        console.error("❌ Falha ao renovar token:", refreshResponse.status, refreshResponse.statusText);
        const errorData = await refreshResponse.json().catch(() => ({}));
        console.error("Erro do backend:", errorData);
        console.error("❌ Refresh token expirado - redirecionando para login");
        redirect("/login");
      }

      const data = await refreshResponse.json();

      if (!data.access) {
        console.error("❌ Token renovado não contém access token - redirecionando para login");
        redirect("/login");
      }

      console.log("✅ Token renovado com sucesso");

      // Update the token in cookies
      await updateToken({
        accessToken: data.access,
        refreshToken: session.refresh,
      });

      // Retry the original request with the new token
      options.headers.Authorization = `Bearer ${data.access}`;
      response = await fetch(url, options);

      if (response.status === 401) {
        console.error("❌ Requisição ainda retorna 401 após renovação - redirecionando para login");
        redirect("/login");
      }

      console.log("✅ Requisição bem-sucedida após renovação do token");
    } catch (error) {
      console.error("❌ Erro durante renovação de token:", error);
      // If there's any error during refresh, redirect to login
      redirect("/login");
    }
  } else if (response.status === 401) {
    console.error("❌ Token expirado e sem refresh token disponível - redirecionando para login");
    redirect("/login");
  }

  return response;
};

/**
 * Server Action wrapper for authenticated fetch with automatic token refresh
 * This MUST be used from Server Actions only (functions marked with "use server")
 * Can modify cookies to refresh tokens
 */
export const authFetchWithRetry = async (url: string | URL, options: FetchOptions = {}) => {
  console.log("🔐 authFetchWithRetry - Iniciando requisição para:", url.toString());

  const session = await verifySession(false);

  if (!session?.access) {
    console.error("❌ Sessão não encontrada ou sem access token - redirecionando para login");
    redirect("/login");
  }

  console.log("✅ Sessão encontrada, user_id:", session.user_id);

  options.headers = {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access}`,
  };

  let response;
  try {
    console.log("📤 Fazendo requisição...");
    response = await fetch(url, options);
    console.log("📥 Resposta recebida - Status:", response.status);
  } catch (error) {
    console.error("❌ Erro na requisição fetch:", error, "URL:", url.toString());
    throw new AuthError("Erro ao fazer requisição", true);
  }

  // If we get a 401, try to refresh the token
  if (response.status === 401 && session.refresh) {
    console.log("🔄 Token expirado, tentando renovar...");

    try {
      const refreshResponse = await fetch(`${BACKEND_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: session.refresh }),
      });

      if (!refreshResponse.ok) {
        console.error("❌ Falha ao renovar token:", refreshResponse.status, refreshResponse.statusText);
        const errorData = await refreshResponse.json().catch(() => ({}));
        console.error("Erro do backend:", errorData);
        console.error("❌ Refresh token expirado - redirecionando para login");
        // Can delete cookies here because we're in a Server Action
        await deleteSession(); // This will redirect to /login
      }

      const data = await refreshResponse.json();

      if (!data.access) {
        console.error("❌ Token renovado não contém access token - redirecionando para login");
        // Can delete cookies here because we're in a Server Action
        await deleteSession(); // This will redirect to /login
      }

      console.log("✅ Token renovado com sucesso");

      // Update the token in cookies (this is safe in Server Actions)
      await updateToken({
        accessToken: data.access,
        refreshToken: session.refresh,
      });

      // Retry the original request with the new token
      options.headers.Authorization = `Bearer ${data.access}`;
      response = await fetch(url, options);

      if (response.status === 401) {
        console.error("❌ Requisição ainda retorna 401 após renovação - redirecionando para login");
        // Can delete cookies here because we're in a Server Action
        await deleteSession(); // This will redirect to /login
      }

      console.log("✅ Requisição bem-sucedida após renovação do token");
    } catch (error) {
      console.error("❌ Erro durante renovação de token:", error);
      // If it's an AuthError or any error during refresh, redirect to login
      if (error instanceof AuthError && error.shouldLogout) {
        console.error("❌ Erro de autenticação crítico - redirecionando para login");
        // Can delete cookies here because we're in a Server Action
        await deleteSession(); // This will redirect to /login
      }
      throw error;
    }
  } else if (response.status === 401) {
    console.error("❌ Token expirado e sem refresh token disponível - redirecionando para login");
    // Can delete cookies here because we're in a Server Action
    await deleteSession(); // This will redirect to /login
  }

  return response;
};
