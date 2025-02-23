
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { PortfolioData } from "./types";

const isMarketOpen = (): boolean => {
  // Get current time in New York (ET)
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;
  
  // Market hours: Monday (1) to Friday (5), 9:30 AM to 4:00 PM ET
  const marketOpenInMinutes = 9 * 60 + 30;  // 9:30 AM
  const marketCloseInMinutes = 16 * 60;     // 4:00 PM
  
  return day >= 1 && day <= 5 && // Monday to Friday
         currentTimeInMinutes >= marketOpenInMinutes &&
         currentTimeInMinutes < marketCloseInMinutes;
};

export const usePortfolioData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First get positions
      const { data: positions, error: positionsError } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id);

      if (positionsError) throw positionsError;

      if (!positions || positions.length === 0) {
        console.log('No positions found');
        return { positions: [], stockPrices: [] };
      }

      console.log('Current positions:', positions);

      // Get ALL transactions to verify position accuracy
      const { data: transactions, error: transactionsError } = await supabase
        .from('paper_trading_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        console.log('All transactions:', transactions);
        
        // Calculate positions from transactions
        const calculatedPositions = transactions.reduce((acc, transaction) => {
          const symbol = transaction.symbol;
          if (!acc[symbol]) {
            acc[symbol] = { 
              quantity: 0, 
              totalCost: 0,
              transactions: [] 
            };
          }
          
          const prevQuantity = acc[symbol].quantity;
          const prevTotalCost = acc[symbol].totalCost;
          
          if (transaction.transaction_type === 'buy') {
            acc[symbol].quantity += Number(transaction.quantity);
            acc[symbol].totalCost += Number(transaction.total_amount);
          } else {
            // For sells, reduce quantity and adjust cost basis proportionally
            acc[symbol].quantity -= Number(transaction.quantity);
            if (prevQuantity > 0) {
              const costPerShare = prevTotalCost / prevQuantity;
              acc[symbol].totalCost -= Number(transaction.quantity) * costPerShare;
            }
          }
          
          acc[symbol].transactions.push({
            ...transaction,
            runningQuantity: acc[symbol].quantity,
            runningCostBasis: acc[symbol].totalCost,
            avgPrice: acc[symbol].quantity > 0 ? 
              acc[symbol].totalCost / acc[symbol].quantity : 0
          });
          
          return acc;
        }, {});

        // Compare calculated positions with actual positions
        positions.forEach(position => {
          const calculated = calculatedPositions[position.symbol];
          if (calculated) {
            const calculatedAvgPrice = calculated.quantity > 0 ? 
              calculated.totalCost / calculated.quantity : 0;
            
            console.log(`\nPosition Analysis for ${position.symbol}:`);
            console.log('Database Position:', {
              quantity: Number(position.quantity),
              avgPrice: Number(position.average_price),
              totalCost: Number(position.quantity) * Number(position.average_price)
            });
            console.log('Calculated from Transactions:', {
              quantity: calculated.quantity,
              avgPrice: calculatedAvgPrice,
              totalCost: calculated.totalCost
            });
            
            // Calculate discrepancy if any
            const quantityDiff = Math.abs(Number(position.quantity) - calculated.quantity);
            const avgPriceDiff = Math.abs(Number(position.average_price) - calculatedAvgPrice);
            
            if (quantityDiff > 0.0001 || avgPriceDiff > 0.01) {
              console.warn(`Discrepancy found for ${position.symbol}:`, {
                quantityDiff,
                avgPriceDiff,
                transactionHistory: calculated.transactions.map(t => ({
                  type: t.transaction_type,
                  quantity: t.quantity,
                  price: t.price,
                  runningQty: t.runningQuantity,
                  runningAvgPrice: t.avgPrice,
                  timestamp: t.created_at
                }))
              });
            }
          } else {
            console.warn(`No transactions found for position: ${position.symbol}`);
          }
        });

        // Check for orphaned transactions (trades for symbols we don't have positions for)
        Object.entries(calculatedPositions).forEach(([symbol, data]) => {
          if (data.quantity !== 0 && !positions.find(p => p.symbol === symbol)) {
            console.warn(`Orphaned transactions found for ${symbol}:`, {
              calculatedQuantity: data.quantity,
              transactions: data.transactions
            });
          }
        });
      }

      // Get stock prices
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
        };
      });

      return {
        positions,
        stockPrices
      } as PortfolioData;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isMarketOpen() ? 60000 : false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

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

  return { portfolioData, isLoading };
};
