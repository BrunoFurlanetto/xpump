"use server";

import { BACKEND_URL } from "@/lib/constants";
import { z } from "zod";

const RegisterSchema = z
  .object({
    username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .refine((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Email inválido"),
    password: z.string().min(8, { message: "Senha deve ter pelo menos 8 caracteres" }),
    password2: z.string().min(8, { message: "Confirmação de senha deve ter pelo menos 8 caracteres" }),
    first_name: z.string().min(1, { message: "Nome é obrigatório" }),
    last_name: z.string().min(1, { message: "Sobrenome é obrigatório" }),
    client_code: z.string().min(1, { message: "Código da empresa é obrigatório" }),
  })
  .refine((data) => data.password === data.password2, {
    message: "As senhas não coincidem",
    path: ["password2"],
  });

type RegisterData = z.infer<typeof RegisterSchema>;

export interface ActionResponse {
  success: boolean;
  message: string;
  errors?: {
    [K in keyof RegisterData]?: string[];
  };
}

export async function submitRegister(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  const validateFormData = RegisterSchema.safeParse({
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    password2: formData.get("password2") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    client_code: formData.get("client_code") as string,
  });

  if (!validateFormData.success) {
    const fieldErrors: Record<string, string[]> = {};
    validateFormData.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field && typeof field === "string") {
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      }
    });

    return {
      success: false,
      message: "Erro ao validar os dados",
      errors: fieldErrors,
    };
  }

  try {
    // Enviar dados para o backend
    const response = await fetch(`${BACKEND_URL}/auth/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validateFormData.data),
    });

    console.log("Resposta do backend:", response);

    if (!response.ok) {
      const errorData = await response.json();

      // Tratar erros específicos do backend
      const backendErrors: Record<string, string[]> = {};

      if (errorData.username) {
        backendErrors.username = errorData.username;
      }
      if (errorData.email) {
        backendErrors.email = errorData.email;
      }
      if (errorData.password) {
        backendErrors.password = errorData.password;
      }
      if (errorData.first_name) {
        backendErrors.first_name = errorData.first_name;
      }
      if (errorData.last_name) {
        backendErrors.last_name = errorData.last_name;
      }
      if (errorData.client_code) {
        backendErrors.client_code = errorData.client_code;
      }

      return {
        success: false,
        message: errorData.detail || "Erro ao criar conta. Verifique os dados e tente novamente.",
        errors: Object.keys(backendErrors).length > 0 ? backendErrors : undefined,
      };
    }

    await response.json();

    // Retornar sucesso para mostrar feedback antes do redirect
    return {
      success: true,
      message: "Conta criada com sucesso! Redirecionando para login...",
    };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return {
      success: false,
      message: "Erro interno do servidor. Tente novamente mais tarde.",
    };
  }
}
