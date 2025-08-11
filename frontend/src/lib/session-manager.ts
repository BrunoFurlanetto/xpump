import { deleteSession } from "./session";
import { redirect } from "next/navigation";

export class SessionManager {
    static async handleAuthError(error: unknown, shouldRedirect = true) {
        console.error("Erro de autenticação:", error);

        if (shouldRedirect) {
            // Se estivermos em um Server Action ou Route Handler, podemos deletar a sessão
            try {
                await deleteSession();
            } catch (e) {
                console.log("Não foi possível deletar sessão no contexto atual:", e);
                // Se não conseguir deletar a sessão, apenas redireciona
                redirect("/login");
            }
        }

        return null;
    }

    static isAuthError(error: unknown): boolean {
        return error instanceof Error &&
            (error.name === 'AuthError' ||
                error.message.includes('autenticação') ||
                error.message.includes('Sessão'));
    }
}
