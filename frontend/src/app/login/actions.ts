"use server";

import { createSession } from "@/lib/session";
import { z } from "zod";

const LoginSchema = z.object({
    user: z.string().min(3, { message: "Informe o usuário" }),
    passwd: z.string().min(3, { message: "Informe a senha" }),
});

type LoginData = z.infer<typeof LoginSchema>;

export interface ActionResponse {
    success: boolean;
    message: string;
    errors?: {
        [K in keyof LoginData]?: string[];
    };
}

export async function submitLogin(
    prevState: ActionResponse | null,
    formData: FormData,
): Promise<ActionResponse> {
    const validateFormData = LoginSchema.safeParse({
        user: formData.get("user") as string,
        passwd: formData.get("passwd") as string,
    });

    if (!validateFormData.success) {
        return {
            success: false,
            message: "Erro ao validar os dados",
            errors: validateFormData.error.flatten().fieldErrors,
        };
    }

    // 2. login
    const userResponse = await fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(validateFormData.data),
    });

    const user = await userResponse.json();
    if (user.error || !user.user)
        return {
            success: false,
            message: user.error || "Erro ao logar, tente novamente!",
        };

    // 3. create  a session
    await createSession(user);
    return {
        success: true,
        message: "Logado com sucesso",
    };
}

