"use client";

import { useEffect } from "react";
import { logout } from "../(auth)/login/actions";

interface LogoutHandlerProps {
  logout?: boolean;
}

export function LogoutHandler({ logout: actionLogout }: LogoutHandlerProps) {
  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (actionLogout) {
      handleLogout();
    }
  }, [actionLogout]);

  return null;
}
