
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Stock } from "@/lib/mockStocks";
import { Badge } from "../ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";

interface Position {
  symbol: string;
  quantity: number;
  average_price: number;
}

interface StockPrice {
  symbol: string;
  currentPrice: number;
  change: number;
}

interface PortfolioPositionsProps {
  stocks: Stock[];
}

export const PortfolioPositions = ({ stocks }: PortfolioPositionsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Combined query for positions and stock prices
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch positions
      const { data: positions, error: positionsError } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id);

      if (positionsError) throw positionsError;

      if (!positions || positions.length === 0) {
        return { positions: [], stockPrices: [] };
      }

      // Fetch current stock prices for positions
      const { data: stockData, error: pricesError } = await supabase
        .from('stock_data_cache')
        .select('*')
        .in('symbol', positions.map(p => p.symbol));

      if (pricesError) {
        toast({
          title: "Error fetching stock prices",
          description: "Please try again later",
          variant: "destructive",
        });
        throw pricesError;
      }

      const stockPrices = (stockData || []).map(item => {
        const stockInfo = item.data as any;
        return {
          symbol: item.symbol,
          currentPrice: stockInfo.price || 0,
          change: stockInfo.change || 0
        } as StockPrice;
      });

      return {
        positions: positions as Position[],
        stockPrices
      };
    },
    staleTime: 10000, // Consider data fresh for 10 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Set up real-time listener for stock price updates
  useEffect(() => {
    if (!portfolioData?.positions.length) return;

    const symbols = portfolioData.positions.map(p => p.symbol);
    const channel = supabase
      .channel('stock-price-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_data_cache',
          filter: `symbol=in.(${symbols.map(s => `'${s}'`).join(',')})`,
        },
        (payload) => {
          console.log('Received stock update:', payload);
          queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portfolioData?.positions.length, queryClient]);

  // Memoize calculations
  const { totalValue, totalGainLoss } = useMemo(() => {
    if (!portfolioData) return { totalValue: 0, totalGainLoss: 0 };

    const { positions, stockPrices } = portfolioData;

    const totals = positions.reduce((acc, position) => {
      const stockPrice = stockPrices.find(s => s.symbol === position.symbol);
      if (!stockPrice) return acc;

      const currentValue = position.quantity * stockPrice.currentPrice;
      const costBasis = position.quantity * position.average_price;
      
      return {
        totalValue: acc.totalValue + currentValue,
        totalGainLoss: acc.totalGainLoss + (currentValue - costBasis)
      };
    }, { totalValue: 0, totalGainLoss: 0 });

    return totals;
  }, [portfolioData]);

  if (isLoading) {
    return (
      <Card className="p-2">
        <p className="text-center text-muted-foreground">Loading portfolio...</p>
      </Card>
    );
  }

  if (!portfolioData?.positions || portfolioData.positions.length === 0) {
    return (
      <Card className="p-2">
        <p className="text-center text-muted-foreground">No positions found. Start trading to see your portfolio here!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-2">
          <div className="flex items-center gap-1 text-muted-foreground mb-1 text-sm">
            <DollarSign className="h-4 w-4" />
            <span>Portfolio Value</span>
          </div>
          <span className="text-lg font-bold">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </Card>
        <Card className="p-2">
          <div className="flex items-center gap-1 text-muted-foreground mb-1 text-sm">
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span>Total Gain/Loss</span>
          </div>
          <span className={`text-lg font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </Card>
      </div>

      <Card className="p-2">
        <div className="overflow-x-auto -mx-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Symbol</TableHead>
                <TableHead className="text-xs text-right">Qty</TableHead>
                <TableHead className="text-xs text-right">Price</TableHead>
                <TableHead className="text-xs text-right">Gain/Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioData.positions.map((position) => {
                const stockPrice = portfolioData.stockPrices.find(s => s.symbol === position.symbol);
                if (!stockPrice) return null;

                const currentValue = position.quantity * stockPrice.currentPrice;
                const costBasis = position.quantity * position.average_price;
                const gainLoss = currentValue - costBasis;
                const gainLossPercent = costBasis !== 0 ? (gainLoss / costBasis) * 100 : 0;

                return (
                  <TableRow key={position.symbol}>
                    <TableCell className="font-medium text-xs py-2">{position.symbol}</TableCell>
                    <TableCell className="text-right text-xs py-2">{position.quantity}</TableCell>
                    <TableCell className="text-right text-xs py-2">${stockPrice.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs py-2">
                      <div className="flex items-center justify-end gap-1">
                        <span>${Math.abs(gainLoss).toFixed(2)}</span>
                        <Badge variant={gainLoss >= 0 ? "default" : "destructive"} className="text-[10px] px-1 py-0">
                          {gainLoss >= 0 ? "+" : "-"}{Math.abs(gainLossPercent).toFixed(1)}%
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
