
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StockCacheData {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export const StockSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: searchResults } = useQuery({
    queryKey: ['stockSearch', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];

      try {
        const { data, error } = await supabase
          .from('stock_data_cache')
          .select('symbol, data')
          .ilike('symbol', `${searchTerm}%`)
          .limit(5);

        if (error) throw error;

        return data.map(item => {
          const stockData = item.data as any;
          return {
            symbol: item.symbol,
            name: stockData.name || 'Unknown',
            price: stockData.price || 0,
            change: stockData.change || 0,
          } as StockCacheData;
        });
      } catch (error) {
        console.error('Error searching stocks:', error);
        toast({
          title: "Error",
          description: "Failed to search stocks. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: searchTerm.length > 0
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      {searchResults && searchResults.length > 0 && (
        <div className="absolute w-full mt-1 bg-background border rounded-md shadow-lg z-10">
          {searchResults.map((stock) => (
            <div
              key={stock.symbol}
              className="p-2 hover:bg-muted cursor-pointer"
              onClick={() => {
                // Handle stock selection
              }}
            >
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-sm text-muted-foreground">{stock.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
