"use client";

import { createContext, useContext, useState, useTransition, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface GroupsLoadingContextType {
  isRefreshing: boolean;
  startRefresh: () => void;
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}

const GroupsLoadingContext = createContext<GroupsLoadingContextType | undefined>(undefined);

export function GroupsLoadingProvider({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startRefresh = () => {
    setIsRefreshing(true);
    // Auto clear after 5 seconds as safety
    setTimeout(() => setIsRefreshing(false), 5000);
  };

  return (
    <GroupsLoadingContext.Provider value={{ isRefreshing, startRefresh, isPending, startTransition }}>
      {children}

      {/* Loading Overlay */}
      {(isRefreshing || isPending) && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card border-2 border-primary/20 rounded-lg p-6 shadow-2xl flex flex-col items-center gap-3 pointer-events-auto">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Atualizando grupos...</p>
          </div>
        </div>
      )}
    </GroupsLoadingContext.Provider>
  );
}

export function useGroupsLoading() {
  const context = useContext(GroupsLoadingContext);

  // Return default values if used outside provider
  if (!context) {
    const [, defaultStartTransition] = useTransition();
    return {
      isRefreshing: false,
      startRefresh: () => {},
      isPending: false,
      startTransition: defaultStartTransition,
    };
  }

  return context;
}
