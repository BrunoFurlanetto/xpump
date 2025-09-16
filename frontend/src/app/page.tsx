import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  // Verificar sessão sem redirecionar automaticamente
  const session = await verifySession(false);

  if (!session) {
    // Se não tem sessão, redirecionar para login
    redirect("/login");
  }

  // Se tem sessão válida, redirecionar para dashboard
  redirect("/dashboard");
}
