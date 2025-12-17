"use client";

import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/userAuthContext";
import { logout } from "@/app/(auth)/login/actions";
import { toast } from "sonner";
import { useEffect, useCallback } from "react";

export function useAuth() {
  const { user, roles, isFetching } = useUserAuth();
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

  // Função para verificar se o usuário tem uma role específica
  const hasRole = useCallback(
    (role: string) => {
      return roles?.some(r => r.toLowerCase() === role.toLowerCase());
    },
    [roles]
  );

  // Função para verificar se o usuário tem pelo menos uma das roles
  const hasAnyRole = useCallback(
    (rolesToCheck: string[]) => {
      return rolesToCheck.some((role) => roles?.includes(role));
    },
    [roles]
  );

  // Função para verificar se o usuário tem todas as roles
  const hasAllRoles = useCallback(
    (rolesToCheck: string[]) => {
      return rolesToCheck.every((role) => roles.includes(role));
    },
    [roles]
  );

  // Move a verificação de autenticação para useEffect para evitar setState durante render
  useEffect(() => {
    if (!isFetching && !user) {
      handleLogout();
    }
  }, [isFetching, user, handleLogout]);

  return {
    user,
    roles,
    isFetching,
    isAuthenticated,
    logout: handleLogout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
}
