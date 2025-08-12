"use client";
import { getUserById } from "@/app/login/actions";
import { verifySession } from "@/lib/session";
import { createContext, use, useEffect, useState } from "react";

interface UserAuthContext {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export const UserAuthContext = createContext<UserAuthContext | undefined>(undefined);

export function UserAuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<UserAuthContext | undefined>(undefined);

  useEffect(() => {
    const getUser = async () => {
      try {
        const sessionUser = await verifySession();
        if (!sessionUser) {
          setUser(undefined);
          return;
        }
        const aUser = await getUserById(sessionUser.user_id || "");
        if (aUser) setUser(aUser);
      } catch (error) {
        console.error("Failed to verify session:", error);
        setUser(undefined);
      }
    };

    getUser();
  }, []);

  return <UserAuthContext value={user}>{children}</UserAuthContext>;
}

export function useUserAuth() {
  const context = use(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
