"use client";
import { getUserById } from "@/app/login/actions";
import { verifySession } from "@/lib/session";
import { createContext, use, useEffect, useState } from "react";

interface UserAuthContext {
  user?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    name: string;
    avatar: string | null;
  };
  isFetching: boolean;
}

export const UserAuthContext = createContext<UserAuthContext | undefined>(undefined);

export function UserAuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<UserAuthContext["user"] | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setIsFetching(true);
      try {
        const sessionUser = await verifySession();
        if (!sessionUser) {
          setUser(undefined);
          return;
        }
        const aUser = await getUserById(sessionUser.user_id || "");
        if (aUser) {
          setUser({
            ...aUser,
          });
        }
      } catch (error) {
        console.error("Failed to verify session:", error);
        setUser(undefined);
      } finally {
        setIsFetching(false);
      }
    };

    getUser();
  }, []);

  return <UserAuthContext value={{ user, isFetching }}>{children}</UserAuthContext>;
}

export function useUserAuth() {
  const context = use(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
