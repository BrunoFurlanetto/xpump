"use client";

import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/userAuthContext";
import { logout } from "@/app/(auth)/login/actions";
import { toast } from "sonner";
import { useEffect, useCallback } from "react";

export function useAuth() {
    const { user, isFetching } = useUserAuth();
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            toast.success("Logout realizado com sucesso");
            router.push("/login");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            toast.error("Erro ao fazer logout");
        }
    }, [router]);

    const isAuthenticated = !!user?.id;

    // Move a verificação de autenticação para useEffect para evitar setState durante render
    useEffect(() => {
        if (!isFetching && !user) {
            handleLogout();
        }
    }, [isFetching, user, handleLogout]);

    return {
        user,
        isFetching,
        isAuthenticated,
        logout: handleLogout,
    };
}
