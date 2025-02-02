import { DollarSign } from "lucide-react";
import { Card } from "../ui/card";

interface AvailableCashProps {
  balance: number;
}

export const AvailableCash = ({ balance }: AvailableCashProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <DollarSign className="h-4 w-4" />
        <span>Available Cash</span>
      </div>
      <span className="text-2xl font-bold">
        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </Card>
  );
};