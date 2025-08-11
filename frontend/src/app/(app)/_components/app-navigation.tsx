"use client";

import { Sidebar } from "./sidebar";
import { MobileNavbar } from "./mobile-navbar";
import { MobileMenu } from "./mobile-menu";

interface AppNavigationProps {
  children: React.ReactNode;
}

export function AppNavigation({ children }: AppNavigationProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="w-64 fixed h-full border-r border-muted bg-background">
          <Sidebar />
        </div>
        <div className="pl-64 w-full">
          <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileNavbar />
        <main className="pt-4 pb-20 px-4">{children}</main>
        <MobileMenu />
      </div>
    </>
  );
}
