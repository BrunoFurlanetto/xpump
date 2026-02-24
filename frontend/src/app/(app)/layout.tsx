import { UserAuthProvider } from "@/context/userAuthContext";
import { NavigationProvider } from "@/context/navigationContext";
import { AppNavigation } from "./_components/app-navigation";
import { PushNotificationPrompt } from "@/components/pwa/push-notification-prompt";

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
          <PushNotificationPrompt />
        </NavigationProvider>
      </UserAuthProvider>
    </div>
  );
}
