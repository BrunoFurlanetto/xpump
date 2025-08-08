import { RequestInit } from "next/dist/server/web/spec-extension/request";
import { verifySession } from "./session";
import { refreshToken } from "@/app/login/actions";


export type VerifySessionType = Awaited<ReturnType<typeof verifySession>>;
export interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const authFetch = async (url: string | URL, options: FetchOptions = {}) => {
    const session = await verifySession();
    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${session?.access}`,
    }
    let response = await fetch(url, options);
    if (response.status === 401) {
        if (session == null || !session?.refresh) throw new Error("Refresh token não encontrado");
        const newAccessToken = await refreshToken(session.refresh);
        if (newAccessToken) {
            options.headers.Authorization = `Bearer ${newAccessToken}`;
            response = await fetch(url, options);
        }
    }
    return response;
};
