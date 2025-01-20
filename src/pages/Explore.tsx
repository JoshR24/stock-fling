import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockNews } from "@/components/stock/StockNews";
import { generateStockBatch } from "@/lib/mockStocks";
import { useToast } from "@/components/ui/use-toast";

const Explore = () => {
  const [stock, setStock] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadStock = async () => {
      try {
        const stocks = await generateStockBatch(1);
        setStock(stocks[0]);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load stock data. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadStock();
  }, [toast]);

  if (!stock) {
    return (
      <div className="min-h-screen bg-background p-4 pb-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Explore</h1>
          <Card className="p-4">
            Loading...
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Explore</h1>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <Card className="p-4">
            <StockNews stock={stock} />
          </Card>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Explore;