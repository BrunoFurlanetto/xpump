"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 80; // px necessários para acionar o refresh
const MAX_PULL = 120; // px máximos de deslocamento visual

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollable = e.currentTarget as HTMLElement;
    if (scrollable.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startYRef.current === null || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - startYRef.current;

      if (delta > 0) {
        isPullingRef.current = true;
        const clamped = Math.min(delta * 0.5, MAX_PULL);
        setPullDistance(clamped);
      }
    },
    [isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;

    if (pullDistance >= THRESHOLD / 2) {
      setIsRefreshing(true);
      setPullDistance(0);
      router.refresh();
      await new Promise((res) => setTimeout(res, 1000));
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }

    startYRef.current = null;
    isPullingRef.current = false;
  }, [pullDistance, router]);

  const progress = Math.min(pullDistance / (THRESHOLD / 2), 1);
  const rotation = progress * 360;

  return (
    <div
      className="relative overflow-y-auto h-full"
      style={{ overscrollBehaviorY: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador de pull */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-150"
        style={{
          height: isRefreshing ? 48 : pullDistance,
          opacity: isRefreshing ? 1 : progress,
        }}
      >
        <div
          className="bg-background border border-border rounded-full p-2 shadow-md"
          style={{
            transform: `rotate(${isRefreshing ? 0 : rotation}deg)`,
            animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
          }}
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Conteúdo deslocado durante o pull */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 48 : pullDistance}px)`,
          transition: isPullingRef.current ? "none" : "transform 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
