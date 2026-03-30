import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAPI, SystemDashboardStats, ClientOverview, GroupOverview, SystemActivity, PaginatedReports, UpdateReportData } from "@/lib/api/admin";
import { toast } from "sonner";

/**
 * Hook para buscar estatísticas gerais do sistema
 */
export function useSystemStats() {
  return useQuery<SystemDashboardStats>({
    queryKey: ["admin", "system", "stats"],
    queryFn: () => AdminAPI.getSystemDashboardStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar lista de clientes (empresas contratadas)
 */
export function useAllClients(
  page: number = 1,
  pageSize: number = 10,
  orderBy: string = "-created_at",
  filters?: {
    is_active?: boolean;
    search?: string;
  }
) {
  return useQuery<{ results: ClientOverview[]; count: number }>({
    queryKey: ["admin", "clients", page, pageSize, orderBy, filters],
    queryFn: () => AdminAPI.getAllClients(page, pageSize, orderBy, filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para buscar lista de grupos
 */
export function useAllGroups(page: number = 1, pageSize: number = 10) {
  return useQuery<{ results: GroupOverview[]; count: number }>({
    queryKey: ["admin", "system", "groups", page, pageSize],
    queryFn: () => AdminAPI.getAllGroups(page, pageSize),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para buscar atividades recentes do sistema
 */
export function useSystemActivities(limit: number = 20, type?: string) {
  return useQuery<SystemActivity[]>({
    queryKey: ["admin", "system", "activities", limit, type],
    queryFn: () => AdminAPI.getSystemActivities(limit, type),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para buscar detalhes de um cliente específico (empresa)
 */
export function useClientDetail(clientId: number | null) {
  return useQuery<ClientOverview>({
    queryKey: ["admin", "client", clientId],
    queryFn: () => AdminAPI.getClientDetail(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para buscar denúncias com filtro por status
 */
export function useAdminReports(status?: string, page: number = 1) {
  return useQuery<PaginatedReports>({
    queryKey: ["admin", "reports", status, page],
    queryFn: () => AdminAPI.getReports(status, page),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para atualizar uma denúncia
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: number; data: UpdateReportData }) =>
      AdminAPI.updateReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Denúncia atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar denúncia");
    },
  });
}
