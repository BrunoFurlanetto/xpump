"use server";

import { authFetch } from "@/lib/auth-fetch";
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
        console.log("🔄 Tentando renovar token...");

        const response = await fetch(`${BACKEND_URL}/auth/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: oldRefreshToken }),
        });

        if (!response.ok) {
            console.log("❌ Falha ao renovar token:", response.status);
            return null;
        }

        const data = await response.json();

        if (!data.access) {
            console.log("❌ Token de acesso não retornado");
            return null;
        }

        await updateToken({
            accessToken: data.access,
            refreshToken: oldRefreshToken
        });

        console.log("✅ Token renovado com sucesso");
        return data.access;
    } catch (error) {
        console.error("❌ Erro ao renovar token:", error);
        return null;
    }
}

type userAuth = {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    photo: string | null;
} | null

export const getUserById = async (userId: string): Promise<userAuth> => {
    const response = await authFetch(`${BACKEND_URL}/auth/users/${userId}/`);
    if (!response.ok) {
        return null
    }
    const user = await response.json();
    const profileResponse = await authFetch(`${BACKEND_URL}/profiles/${user.profile_id}/`);
    let photo = null;
    if (profileResponse.ok) {
        const profile = await profileResponse.json();
        photo = profile.photo || null;
        console.log("profile", profile);
    }
    // TODO : API PRECISA BUSCAR O PROFILE APARTIR DO USUÁRIO
    return {
        id: userId,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        photo
    } as userAuth;
};

export const logout = async () => {
    await deleteSession();
}
