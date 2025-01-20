import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockNews } from "@/components/stock/StockNews";
import { mockStocks } from "@/lib/mockStocks";

const Explore = () => {
  // For now, we'll show news from the first mock stock
  const stock = mockStocks[0];

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