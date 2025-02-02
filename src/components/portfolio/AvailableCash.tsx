import { DollarSign } from "lucide-react";
import { Card } from "../ui/card";

interface AvailableCashProps {
  balance: number;
}

export const AvailableCash = ({ balance }: AvailableCashProps) => {
  return (
    <Card className="p-2">
      <div className="flex items-center gap-1 text-muted-foreground mb-1 text-sm">
        <DollarSign className="h-4 w-4" />
        <span>Available Cash</span>
      </div>
      <span className="text-lg font-bold">
        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </Card>
  );
};