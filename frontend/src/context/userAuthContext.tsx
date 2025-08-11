"use client";
import { createContext, use } from "react";

interface UserAuthContext {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export const UserAuthContext = createContext<UserAuthContext | undefined>(undefined);

export function UserAuthProvider({
  children,
  user,
}: {
  readonly children: React.ReactNode;
  readonly user: UserAuthContext;
}) {
  return <UserAuthContext value={user}>{children}</UserAuthContext>;
}

export function useUserAuth() {
  const context = use(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
