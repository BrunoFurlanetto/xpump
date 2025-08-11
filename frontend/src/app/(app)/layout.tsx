import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getUserById } from "../login/actions";
import { UserAuthProvider } from "@/context/userAuthContext";
import { NavigationProvider } from "@/context/navigationContext";
import { AppNavigation } from "./_components/app-navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Verificar sessão primeiro
  const session = await verifySession(false);
  if (!session) {
    console.log("Sessão não encontrada no layout, redirecionando para login");
    redirect("/login");
  }

  // Tentar buscar usuário
  let user;
  try {
    user = await getUserById(session.user_id || "");
  } catch (error) {
    console.log("Erro ao buscar usuário no layout:", error);
    user = null;
  }

  // Se não conseguir buscar o usuário, redirecionar para login
  if (!user) {
    console.log("Usuário não encontrado, redirecionando para login");
    redirect("/login");
  }

  return (
    <div className="bg-background min-h-screen">
      <UserAuthProvider user={user}>
        <NavigationProvider>
          <AppNavigation>{children}</AppNavigation>
        </NavigationProvider>
      </UserAuthProvider>
    </div>
  );
}
