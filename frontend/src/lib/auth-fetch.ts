import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { verifySession } from "./session";
import { refreshToken } from "@/app/login/actions";

export type VerifySessionType = Awaited<ReturnType<typeof verifySession>>;
export interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
    skipRefresh?: boolean; // Para evitar loops infinitos
}

export class AuthError extends Error {
    constructor(message: string, public shouldLogout = false) {
        super(message);
        this.name = 'AuthError';
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
    }

    let response = await fetch(url, options);

    // Se receber 401 e não for uma tentativa de refresh, tentar renovar o token
    if (response.status === 401 && !options.skipRefresh) {

        if (!session.refresh) {
            throw new AuthError("Sessão expirada", true);
        }

        try {
            const newAccessToken = await refreshToken(session.refresh);
            if (newAccessToken) {
                options.headers.Authorization = `Bearer ${newAccessToken}`;
                response = await fetch(url, options);
            } else {
                throw new AuthError("Falha ao renovar sessão", true);
            }
        } catch {
            throw new AuthError("Erro de autenticação", true);
        }
    }

    return response;
};
