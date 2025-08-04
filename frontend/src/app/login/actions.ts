"use server";

import { BACKEND_URL } from "@/lib/constants";
import { createSession, deleteSession, updateToken } from "@/lib/session";
import { z } from "zod";

const LoginSchema = z.object({
    username: z.string().min(3, { message: "Informe o usuário" }),
    password: z.string().min(3, { message: "Informe a senha" }),
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
        username: formData.get("username") as string,
        password: formData.get("password") as string,
    });

    if (!validateFormData.success) {
        return {
            success: false,
            message: "Erro ao validar os dados",
            errors: validateFormData.error.flatten().fieldErrors,
        };
    }

    // 2. login
    const userResponse = await fetch(`${BACKEND_URL}/auth/token/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(validateFormData.data),
    });

    console.log("userResponse", userResponse);

    if (!userResponse.ok) {
        const errorData = await userResponse.json();
        return {
            success: false,
            message: errorData.error || "Erro ao logar, tente novamente!",
        };
    }

    const user = await userResponse.json();
    console.log("user", user);
    if (user.error || !user.access)
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


export const refreshToken = async (oldRefreshToken: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/refresh/`, {
            method: "POST",
            body: JSON.stringify({ refresh: oldRefreshToken }),
        })

        const { access } = await response.json();
        await updateToken({ accessToken: access, refreshToken: oldRefreshToken });
        return access;
    } catch {
        return null;
    }
}

export const logout = async () => {
    await deleteSession();
}
