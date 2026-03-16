"use client";

import { useState } from "react";
import { useUserAuth } from "@/context/userAuthContext";
import { useAdminReports, useUpdateReport } from "@/hooks/useAdminQuery";
import type { AdminReport, UpdateReportData } from "@/lib/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flag,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

const STATUS_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "reviewing", label: "Em Revisão" },
  { value: "resolved", label: "Resolvidas" },
  { value: "dismissed", label: "Descartadas" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "Pendente", variant: "destructive", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  reviewing: { label: "Em Revisão", variant: "default", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  resolved: { label: "Resolvida", variant: "secondary", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  dismissed: { label: "Descartada", variant: "outline", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Conteúdo impróprio",
  harassment: "Assédio ou bullying",
  fake: "Informação falsa",
  other: "Outro",
};

export default function ReportsPage() {
  const { isAdmin } = useUserAuth();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminResponse, setAdminResponse] = useState("");

  const { data, isLoading } = useAdminReports(statusFilter, page);
  const updateReport = useUpdateReport();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openDetail = (report: AdminReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
    setAdminResponse(report.response || "");
    setDetailOpen(true);
  };

  const handleUpdateStatus = (status: UpdateReportData["status"]) => {
    if (!selectedReport || !status) return;

    updateReport.mutate(
      {
        reportId: selectedReport.id,
        data: {
          status,
          admin_notes: adminNotes.trim() || undefined,
          response: adminResponse.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setDetailOpen(false);
          setSelectedReport(null);
        },
      }
    );
  };

  const totalPages = data ? Math.ceil(data.count / 10) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Flag className="h-7 w-7 text-primary" />
          Gestão de Denúncias
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Gerencie as denúncias reportadas pelos usuários
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Lista de denúncias */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data?.results?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma denúncia encontrada com este filtro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.results.map((report) => {
            const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
            return (
              <Card
                key={report.id}
                className="hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => openDetail(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${statusCfg.color} border`}>{statusCfg.label}</Badge>
                        <Badge variant="outline">{report.report_type === "post" ? "Post" : "Comentário"}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Reportado por </span>
                        <span className="font-medium">@{report.reporter.username}</span>
                      </p>
                      {report.post && (
                        <p className="text-sm text-muted-foreground truncate">
                          Post de @{report.post.user.username}: {report.post.content_text || "(sem texto)"}
                        </p>
                      )}
                      {report.comment && (
                        <p className="text-sm text-muted-foreground truncate">
                          Comentário de @{report.comment.user.username}: {report.comment.text}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog de detalhe */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Denúncia #{selectedReport.id}
                </DialogTitle>
                <DialogDescription>
                  {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
                  {selectedReport.other_reason && ` — ${selectedReport.other_reason}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Status atual */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={`${STATUS_CONFIG[selectedReport.status]?.color || ""} border`}>
                    {STATUS_CONFIG[selectedReport.status]?.label || selectedReport.status}
                  </Badge>
                </div>

                {/* Reportado por */}
                <div>
                  <p className="text-sm font-medium mb-1">Reportado por</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.reporter.full_name} (@{selectedReport.reporter.username})
                  </p>
                </div>

                {/* Conteúdo denunciado */}
                <div>
                  <p className="text-sm font-medium mb-1">Conteúdo denunciado</p>
                  <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                    {selectedReport.post && (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">
                          Post de @{selectedReport.post.user.username}
                        </p>
                        <p>{selectedReport.post.content_text || "(sem texto)"}</p>
                      </>
                    )}
                    {selectedReport.comment && (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">
                          Comentário de @{selectedReport.comment.user.username}
                        </p>
                        <p>{selectedReport.comment.text}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Notas administrativas */}
                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Notas administrativas</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notas internas sobre esta denúncia..."
                    className="min-h-[60px] resize-none"
                  />
                </div>

                {/* Resposta */}
                <div className="space-y-2">
                  <Label htmlFor="admin-response">Resposta</Label>
                  <Textarea
                    id="admin-response"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Resposta sobre a denúncia..."
                    className="min-h-[60px] resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedReport.status === "pending" && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus("reviewing")}
                    disabled={updateReport.isPending}
                  >
                    {updateReport.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Revisar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus("dismissed")}
                  disabled={updateReport.isPending}
                >
                  {updateReport.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Descartar
                </Button>
                <Button onClick={() => handleUpdateStatus("resolved")} disabled={updateReport.isPending}>
                  {updateReport.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Resolver
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
