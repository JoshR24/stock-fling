
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

      console.log('Fetching portfolio data for user:', user.id);

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

      // Get transaction history to verify cost basis
      const { data: transactions, error: transactionsError } = await supabase
        .from('paper_trading_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        console.log('All transactions:', transactions);
        
        // Calculate expected position values from transactions
        const calculatedPositions = transactions.reduce((acc, transaction) => {
          const symbol = transaction.symbol;
          if (!acc[symbol]) {
            acc[symbol] = { quantity: 0, totalCost: 0 };
          }
          
          if (transaction.transaction_type === 'buy') {
            acc[symbol].quantity += Number(transaction.quantity);
            acc[symbol].totalCost += Number(transaction.total_amount);
          } else {
            acc[symbol].quantity -= Number(transaction.quantity);
            acc[symbol].totalCost -= (Number(transaction.quantity) * (acc[symbol].totalCost / acc[symbol].quantity));
          }
          
          return acc;
        }, {});

        console.log('Calculated positions from transactions:', calculatedPositions);
        
        // Compare with actual positions
        positions.forEach(position => {
          const calculated = calculatedPositions[position.symbol];
          if (calculated) {
            const calculatedAvgPrice = calculated.quantity > 0 ? 
              calculated.totalCost / calculated.quantity : 0;
            
            console.log(`Position comparison for ${position.symbol}:`);
            console.log('Database position:', {
              quantity: Number(position.quantity),
              avgPrice: Number(position.average_price),
              totalCost: Number(position.quantity) * Number(position.average_price)
            });
            console.log('Calculated from transactions:', {
              quantity: calculated.quantity,
              avgPrice: calculatedAvgPrice,
              totalCost: calculated.totalCost
            });
          }
        });
      }

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

      console.log('Current stock prices:', stockPrices);

      // Get current cash balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('paper_trading_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!balanceError && balanceData) {
        console.log('Current cash balance:', balanceData.balance);
      }

      // Calculate totals for verification
      let totalInvestment = 0;
      let currentValue = 0;

      positions.forEach(position => {
        const price = stockPrices.find(p => p.symbol === position.symbol)?.currentPrice || 0;
        const quantity = Number(position.quantity);
        const avgPrice = Number(position.average_price);
        
        totalInvestment += quantity * avgPrice;
        currentValue += quantity * price;

        console.log(`Position details for ${position.symbol}:`, {
          quantity,
          avgPrice,
          currentPrice: price,
          investment: quantity * avgPrice,
          marketValue: quantity * price,
          gainLoss: (quantity * price) - (quantity * avgPrice)
        });
      });

      console.log('Portfolio summary:', {
        totalInvestment,
        currentValue,
        totalGainLoss: currentValue - totalInvestment,
        cashBalance: balanceData?.balance || 0,
        accountTotal: (balanceData?.balance || 0) + currentValue
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
