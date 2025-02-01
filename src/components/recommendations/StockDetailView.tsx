import { Button } from "@/components/ui/button";
import { Stock } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { ArrowLeft, PlusCircle } from "lucide-react";

interface StockDetailViewProps {
  stock: Stock;
  onClose: () => void;
  onAddToPortfolio: (symbol: string) => Promise<void>;
  onSwipe: (direction: "left" | "right") => void;
}

export const StockDetailView = ({ 
  stock, 
  onClose, 
  onAddToPortfolio, 
  onSwipe 
}: StockDetailViewProps) => {
  return (
    <div className="fixed inset-0 bg-background p-4 z-50">
      <div className="max-w-md mx-auto relative min-h-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 left-2 z-50 bg-background/50 backdrop-blur-sm"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 z-50 bg-background/50 backdrop-blur-sm"
          onClick={async () => {
            await onAddToPortfolio(stock.symbol);
            onClose();
          }}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add to Portfolio
        </Button>
        <StockCard 
          stock={stock} 
          onSwipe={onSwipe}
        />
      </div>
    </div>
  );
};