"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";

interface ErrorContextType {
  handleError: (error: Error | string, showToast?: boolean) => void;
  clearError: () => void;
  lastError: string | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [lastError, setLastError] = useState<string | null>(null);

  const handleError = useCallback((error: Error | string, showToast = true) => {
    const errorMessage = typeof error === "string" ? error : error.message;

    console.error("❌ Error:", errorMessage);
    setLastError(errorMessage);

    if (showToast) {
      toast.error(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const value = useMemo(
    () => ({
      handleError,
      clearError,
      lastError,
    }),
    [handleError, clearError, lastError]
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}
