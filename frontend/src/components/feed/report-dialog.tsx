"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCreateReport } from "@/hooks/useFeedQuery";
import type { CreateReportData } from "@/lib/api/feed";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: number;
  commentId?: number;
  reportType: "post" | "comment";
}

const REASON_LABELS: Record<CreateReportData["reason"], string> = {
  spam: "Spam",
  inappropriate: "Conteúdo impróprio",
  harassment: "Assédio ou bullying",
  fake: "Informação falsa",
  other: "Outro",
};

export function ReportDialog({ open, onOpenChange, postId, commentId, reportType }: ReportDialogProps) {
  const [reason, setReason] = useState<CreateReportData["reason"] | "">("");
  const [otherReason, setOtherReason] = useState("");
  const createReport = useCreateReport();

  const resetForm = () => {
    setReason("");
    setOtherReason("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!reason) return;

    const data: CreateReportData = {
      report_type: reportType,
      reason,
      ...(reportType === "post" && postId ? { post: postId } : {}),
      ...(reportType === "comment" && commentId ? { comment: commentId } : {}),
      ...(reason === "other" && otherReason.trim() ? { other_reason: otherReason.trim() } : {}),
    };

    createReport.mutate(data, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar {reportType === "post" ? "publicação" : "comentário"}</DialogTitle>
          <DialogDescription>
            Selecione o motivo da denúncia. Nossa equipe analisará o conteúdo reportado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as CreateReportData["reason"])}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="other-reason">Descreva o motivo</Label>
              <Textarea
                id="other-reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Explique o motivo da denúncia..."
                className="min-h-[80px] resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={createReport.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || (reason === "other" && !otherReason.trim()) || createReport.isPending}
          >
            {createReport.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar denúncia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
