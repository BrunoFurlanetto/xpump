"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { AdjustmentEntry } from "@/lib/api/gamification";

interface AdjustmentBadgeProps {
  type: "bonus" | "penalty";
  total: number;
  entries: AdjustmentEntry[];
}

export function AdjustmentBadge({ type, total, entries }: AdjustmentBadgeProps) {
  if (total <= 0) return null;

  const isBonus = type === "bonus";
  const Icon = isBonus ? TrendingUp : TrendingDown;
  const colorClasses = isBonus
    ? "bg-green-500/10 text-green-500 border-green-500/20 border"
    : "bg-red-500/10 text-red-500 border-red-500/20 border";
  const label = isBonus ? `+${total}` : `-${total}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge className={`${colorClasses} text-xs cursor-pointer hover:opacity-80`}>
          <Icon className="h-3 w-3 mr-1" />
          {label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isBonus ? "Bônus aplicados" : "Penalidades aplicadas"}
          </p>
          {entries.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.map((entry, i) => (
                <div key={i} className="text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isBonus ? "text-green-500" : "text-red-500"}`}>
                      {isBonus ? "+" : "-"}{entry.score} pts
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {entry.reason && (
                    <p className="text-muted-foreground mt-0.5">{entry.reason}</p>
                  )}
                  <p className="text-muted-foreground/70 mt-0.5">
                    por {entry.created_by.fullname}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sem detalhes disponíveis</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
