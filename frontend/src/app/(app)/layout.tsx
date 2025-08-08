import { verifySession } from "@/lib/session";
import TopBar from "./_components/topbar";
import { redirect } from "next/navigation";
import { getUserById } from "../login/actions";
import { UserAuthProvider } from "@/context/userAuthContext";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();
  console.log("session", session);
  if (!session) redirect("/login");

  const user = await getUserById(session?.user_id || "");
  console.log("user", user);
  if (!user) redirect("/login");

  return (
    <main className="bg-background min-h-screen flex flex-col">
      <UserAuthProvider user={user}>
        <TopBar />
        {children}
      </UserAuthProvider>
    </main>
  );
}
