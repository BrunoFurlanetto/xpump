import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { verifySession, deleteSession } from "./session";
import { refreshToken } from "@/app/login/actions";

export type VerifySessionType = Awaited<ReturnType<typeof verifySession>>;
export interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
    skipRefresh?: boolean; // Para evitar loops infinitos
}

export const authFetch = async (url: string | URL, options: FetchOptions = {}) => {
    const session = await verifySession(false);

    if (!session?.access) {
        throw new Error("Sessão não encontrada");
    }

    options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access}`,
    }

    let response = await fetch(url, options);

    // Se receber 401 e não for uma tentativa de refresh, tentar renovar o token
    if (response.status === 401 && !options.skipRefresh) {
        console.log("🔄 Token expirado, tentando renovar...");

        if (!session.refresh) {
            console.log("❌ Refresh token não encontrado, fazendo logout");
            await deleteSession();
            throw new Error("Sessão expirada");
        }

        try {
            const newAccessToken = await refreshToken(session.refresh);
            if (newAccessToken) {
                console.log("✅ Token renovado com sucesso");
                options.headers.Authorization = `Bearer ${newAccessToken}`;
                response = await fetch(url, options);
            } else {
                console.log("❌ Falha ao renovar token, fazendo logout");
                await deleteSession();
                throw new Error("Falha ao renovar sessão");
            }
        } catch (error) {
            console.error("❌ Erro ao renovar token:", error);
            await deleteSession();
            throw new Error("Erro de autenticação");
        }
    }

    return response;
};
