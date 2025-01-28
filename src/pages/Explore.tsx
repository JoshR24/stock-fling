import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockNews } from "@/components/stock/StockNews";
import { generateStockBatch } from "@/lib/mockStocks";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { StockCard } from "@/components/StockCard";

// Extended mock data with company names
const companyData = [
  { symbol: "AAPL", name: "Apple Inc.", change: 2.5 },
  { symbol: "GOOGL", name: "Alphabet Inc.", change: -1.2 },
  { symbol: "MSFT", name: "Microsoft Corporation", change: 1.8 },
  { symbol: "AMZN", name: "Amazon.com Inc.", change: 0.9 },
  { symbol: "META", name: "Meta Platforms Inc.", change: -0.7 },
  { symbol: "TSLA", name: "Tesla Inc.", change: 3.2 },
  { symbol: "NVDA", name: "NVIDIA Corporation", change: 4.1 }
];

const Explore = () => {
  const [stock, setStock] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof companyData>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = companyData.filter(company => 
        company.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const loadStockData = async (symbol: string) => {
    try {
      const stocks = await generateStockBatch(1);
      setStock(stocks[0]);
      toast({
        title: "Stock Loaded",
        description: `Successfully loaded data for ${symbol}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Explore</h1>
        
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search stocks or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {suggestions.length > 0 && (
            <Card className="absolute w-full mt-1 z-50">
              <ScrollArea className="max-h-[200px]">
                {suggestions.map((company) => (
                  <button
                    key={company.symbol}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
                    onClick={() => {
                      setSearchQuery(company.symbol);
                      setSuggestions([]);
                      loadStockData(company.symbol);
                    }}
                  >
                    <div>
                      <div className="font-medium">{company.symbol}</div>
                      <div className="text-sm text-muted-foreground">{company.name}</div>
                    </div>
                    <span className={`text-sm ${company.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {company.change >= 0 ? '+' : ''}{company.change.toFixed(1)}%
                    </span>
                  </button>
                ))}
              </ScrollArea>
            </Card>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          {stock ? (
            <>
              <StockCard stock={stock} onSwipeLeft={() => {}} onSwipeRight={() => {}} />
              <Card className="p-4 mt-4">
                <StockNews stock={stock} />
              </Card>
            </>
          ) : (
            <Card className="p-4">
              <p className="text-muted-foreground text-center">
                Search for a stock to view details and news
              </p>
            </Card>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Explore;