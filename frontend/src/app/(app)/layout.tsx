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
  const session = await verifySession();
  if (!session) redirect("/login");

  const user = await getUserById(session?.user_id || "");
  if (!user) redirect("/login");

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
