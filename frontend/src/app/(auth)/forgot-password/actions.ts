"use server";

import { BACKEND_URL } from "@/lib/constants";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
    email: z.string().min(1, "Email é obrigatório").refine(
        (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        "Email inválido"
    ),
});

type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

export interface ActionResponse {
    success: boolean;
    message: string;
    errors?: {
        [K in keyof ForgotPasswordData]?: string[];
    };
}

export async function submitForgotPassword(
    prevState: ActionResponse | null,
    formData: FormData,
): Promise<ActionResponse> {
    const validateFormData = ForgotPasswordSchema.safeParse({
        email: formData.get("email") as string,
    });

    if (!validateFormData.success) {
        return {
            success: false,
            message: "Erro ao validar os dados",
            errors: validateFormData.error.flatten().fieldErrors,
        };
    }

    try {
        // Enviar solicitação de reset de senha para o backend
        const response = await fetch(`${BACKEND_URL}/auth/forgot-password/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: validateFormData.data.email,
            }),
        });

        if (!response.ok) {
            // Se o email não existir no sistema, ainda retornamos sucesso por segurança
            // Para não revelar se um email está cadastrado ou não
            if (response.status === 404) {
                return {
                    success: true,
                    message: "Se o email estiver cadastrado, você receberá as instruções em breve",
                };
            }

            const errorData = await response.json().catch(() => null);

            return {
                success: false,
                message: errorData?.detail || errorData?.message || "Erro interno do servidor",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: data.message || "Instruções enviadas para seu email",
        };

    } catch (error) {
        console.error("Erro ao solicitar reset de senha:", error);
        return {
            success: false,
            message: "Erro de conexão com o servidor",
        };
    }
}
