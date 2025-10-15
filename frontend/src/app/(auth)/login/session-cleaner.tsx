"use client";

import { useEffect } from "react";
import { clearSessionCookie } from "./clear-session-action";

/**
 * Component that clears invalid session cookies when the login page is loaded
 * This helps clean up expired or invalid sessions
 */
export function SessionCleaner() {
  useEffect(() => {
    // Clear any existing session cookie when landing on login page
    clearSessionCookie().catch(() => {
      // Silently fail if there's an error
    });
  }, []);

  return null; // This component doesn't render anything
}
