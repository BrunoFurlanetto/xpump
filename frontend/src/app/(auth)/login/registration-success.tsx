"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export function RegistrationSuccess() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  useEffect(() => {
    if (registered === "true") {
      toast.success("Conta criada com sucesso!", {
        description: "Agora você pode fazer login com suas credenciais",
        icon: <CheckCircle className="h-4 w-4" />,
        duration: 5000,
      });
    }
  }, [registered]);

  return null;
}
