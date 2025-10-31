import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function GroupCardSkeleton() {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border">
      <CardHeader className="space-y-3">
        {/* Header com nome e badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Membros skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full border-2 border-background" />
            ))}
          </div>
        </div>

        {/* Botão */}
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function GroupListSkeleton() {
  return (
    <>
      {/* Grupo da Empresa Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <GroupCardSkeleton />
          <GroupCardSkeleton />
          <GroupCardSkeleton />
        </div>
      </div>
    </>
  );
}
