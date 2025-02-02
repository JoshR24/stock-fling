import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StockSuggestion {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
}

export const StockSearch = ({ onStockSelect }: StockSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const searchStocks = async () => {
      if (searchQuery.length > 0) {
        try {
          const { data: stockData, error } = await supabase
            .from('stock_data_cache')
            .select('symbol, data')
            .or(`symbol.ilike.%${searchQuery}%,data->>name.ilike.%${searchQuery}%`)
            .limit(10);

          if (error) throw error;

          const formattedSuggestions = (stockData)?.map(stock => ({
            symbol: stock.symbol,
            name: stock.data.name as string,
            price: stock.data.price as number,
            change: stock.data.change as number
          })) || [];

          setSuggestions(formattedSuggestions);
        } catch (error) {
          console.error('Error searching stocks:', error);
          toast({
            title: "Error",
            description: "Failed to search stocks. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(searchStocks, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, toast]);

  return (
    <div className="relative">
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
                onClick={() => onStockSelect(company.symbol)}
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
  );
};