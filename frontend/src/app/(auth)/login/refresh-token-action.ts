"use server";
import { cookies } from "next/headers";
import { encrypt, decrypt } from "@/lib/session";

const cookie = {
  name: "session",
  options: {
    httpOnly: false,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
  duration: 30 * 24 * 60 * 60 * 1000,
};

export async function updateTokenInCookies(accessToken: string, refreshToken: string): Promise<boolean> {
  console.log("💾 [updateTokenInCookies] Atualizando token nos cookies...");
  console.log("📝 [updateTokenInCookies] Access token:", accessToken?.substring(0, 20) + "...");
  console.log("📝 [updateTokenInCookies] Refresh token:", refreshToken?.substring(0, 20) + "...");

  try {
    const cookieStore = await cookies();
    const ck = cookieStore.get(cookie.name)?.value;

    if (!ck) {
      console.error("❌ [updateTokenInCookies] Cookie de sessão não encontrado");
      return false;
    }

    console.log("✅ [updateTokenInCookies] Cookie de sessão encontrado");

    const session = await decrypt(ck);

    if (!session?.user_id) {
      console.error("❌ [updateTokenInCookies] Sessão inválida ou sem user_id");
      return false;
    }

    console.log("✅ [updateTokenInCookies] Sessão válida, user_id:", session.user_id);

    const expires = new Date(Date.now() + cookie.duration);
    console.log("📅 [updateTokenInCookies] Nova data de expiração:", expires.toISOString());

    const newSession = await encrypt({
      ...session,
      access: accessToken,
      refresh: refreshToken,
      expires,
    });

    console.log("✅ [updateTokenInCookies] Nova sessão criptografada");
    console.log("💾 [updateTokenInCookies] Tentando salvar no cookie...");

    cookieStore.set(cookie.name, newSession, {
      ...cookie.options,
      expires,
    });

    console.log("✅ [updateTokenInCookies] Cookie atualizado com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ [updateTokenInCookies] Erro ao atualizar cookie:", error);
    console.error("❌ [updateTokenInCookies] Tipo do erro:", error instanceof Error ? error.name : typeof error);
    console.error("❌ [updateTokenInCookies] Mensagem:", error instanceof Error ? error.message : String(error));
    return false;
  }
}
