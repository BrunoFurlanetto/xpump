import { UserAuthProvider } from "@/context/userAuthContext";
import { NavigationProvider } from "@/context/navigationContext";
import { AppNavigation } from "./_components/app-navigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background min-h-screen">
      <UserAuthProvider>
        <NavigationProvider>
          <AppNavigation>{children}</AppNavigation>
        </NavigationProvider>
      </UserAuthProvider>
    </div>
  );
}
