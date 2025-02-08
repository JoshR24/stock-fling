
import { Skeleton } from "../ui/skeleton";
import { Card } from "../ui/card";

export const LoadingPortfolio = () => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-2">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-32" />
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-32" />
        </Card>
      </div>
      <Card className="p-2">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    </div>
  );
};
