"use client";
import { getUserById } from "@/app/(auth)/login/actions";
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
    profile_id: string;
  };
  roles: string[];
  isFetching: boolean;
  isAdmin: boolean;
}

export const UserAuthContext = createContext<UserAuthContext | undefined>(undefined);

export function UserAuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<UserAuthContext["user"] | undefined>(undefined);
  const [roles, setRoles] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setIsFetching(true);
      try {
        const sessionUser = await verifySession();
        if (!sessionUser) {
          setUser(undefined);
          setRoles([]);
          return;
        }

        // Decodificar o access token para extrair as roles
        const accessToken = sessionUser.access;
        if (accessToken) {
          try {
            const tokenParts = accessToken.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              setRoles(payload.role || []);
            }
          } catch (error) {
            console.error("Failed to decode access token:", error);
            setRoles([]);
          }
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
        setRoles([]);
      } finally {
        setIsFetching(false);
      }
    };

    getUser();
  }, []);

  const isAdmin = roles.some((role) => role.toLowerCase() === "admin");

  const objectReturn = {
    user,
    roles,
    isFetching,
    isAdmin,
  };
  return <UserAuthContext value={objectReturn}>{children}</UserAuthContext>;
}

export function useUserAuth() {
  const context = use(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
