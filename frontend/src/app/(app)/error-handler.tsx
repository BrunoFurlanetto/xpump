"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface ErrorHandlerProps {
  error?: string;
}

export function ErrorHandler({ error }: ErrorHandlerProps) {
  useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar dados", {
        description: error,
      });
    }
  }, [error]);

  return null;
}
