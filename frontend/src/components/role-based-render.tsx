"use client";

import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

interface RoleBasedRenderProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  requireAll?: boolean; // Se true, requer todas as roles; se false, requer pelo menos uma
  fallback?: ReactNode;
}

/**
 * Componente para renderização condicional baseada em roles do usuário
 *
 * @example
 * // Requer uma role específica
 * <RoleBasedRender requiredRole="admin">
 *   <AdminPanel />
 * </RoleBasedRender>
 *
 * @example
 * // Requer pelo menos uma das roles
 * <RoleBasedRender requiredRoles={["admin", "moderator"]}>
 *   <ModerationPanel />
 * </RoleBasedRender>
 *
 * @example
 * // Requer todas as roles
 * <RoleBasedRender requiredRoles={["admin", "verified"]} requireAll>
 *   <VerifiedAdminPanel />
 * </RoleBasedRender>
 *
 * @example
 * // Com fallback
 * <RoleBasedRender requiredRole="premium" fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </RoleBasedRender>
 */
export function RoleBasedRender({
  children,
  requiredRole,
  requiredRoles,
  requireAll = false,
  fallback = null,
}: RoleBasedRenderProps) {
  const { hasRole, hasAnyRole, hasAllRoles, isFetching } = useAuth();

  // Enquanto está carregando, não renderiza nada
  if (isFetching) {
    return null;
  }

  let hasPermission = false;

  if (requiredRole) {
    hasPermission = hasRole(requiredRole);
  } else if (requiredRoles && requiredRoles.length > 0) {
    hasPermission = requireAll ? hasAllRoles(requiredRoles) : hasAnyRole(requiredRoles);
  } else {
    // Se nenhuma role foi especificada, renderiza por padrão
    hasPermission = true;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
