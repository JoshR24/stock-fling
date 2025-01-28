import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockNews } from "@/components/stock/StockNews";
import { generateStockBatch } from "@/lib/mockStocks";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Explore = () => {
  const [stock, setStock] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  // Mock suggestions - in a real app, this would come from an API
  useEffect(() => {
    if (searchQuery.length > 0) {
      // Mock stock symbols for demonstration
      const mockSymbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "META", "TSLA", "NVDA"];
      const filtered = mockSymbols.filter(symbol => 
        symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

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
        
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {suggestions.length > 0 && (
            <Card className="absolute w-full mt-1 z-50">
              <ScrollArea className="max-h-[200px]">
                {suggestions.map((symbol) => (
                  <button
                    key={symbol}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                    onClick={() => {
                      setSearchQuery(symbol);
                      setSuggestions([]);
                      // Here you would typically fetch the stock data
                      toast({
                        title: "Stock Selected",
                        description: `Loading data for ${symbol}...`,
                      });
                    }}
                  >
                    {symbol}
                  </button>
                ))}
              </ScrollArea>
            </Card>
          )}
        </div>

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