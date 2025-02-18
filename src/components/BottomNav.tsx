
import { Link, useLocation } from "react-router-dom";
import { Grid, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const formatPortfolioValue = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
};

const BottomNav = () => {
  const location = useLocation();
  
  const { data: portfolioData } = useQuery({
    queryKey: ['portfolio-value'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalValue: 0 };

      // Get positions
      const { data: positions, error: positionsError } = await supabase
        .from('paper_trading_positions')
        .select('symbol, quantity, average_price')
        .eq('user_id', user.id);

      if (positionsError) throw positionsError;

      // Get current stock prices
      const { data: stockPrices, error: pricesError } = await supabase
        .from('stock_data_cache')
        .select('symbol, data');

      if (pricesError) throw pricesError;

      // Calculate total portfolio value
      const totalValue = positions.reduce((sum, position) => {
        const stockData = stockPrices.find(s => s.symbol === position.symbol)?.data as any;
        if (!stockData?.price) return sum;
        return sum + (position.quantity * stockData.price);
      }, 0);

      return { totalValue };
    },
    staleTime: 30000, // Refetch every 30 seconds
    gcTime: 5 * 60 * 1000,
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t h-16">
      <div className="max-w-md mx-auto h-full">
        <div className="grid grid-cols-4 gap-1 h-full">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Grid className="h-5 w-5 mb-1" />
            <span>Swipe</span>
          </Link>
          <Link
            to="/explore"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/explore") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Search className="h-5 w-5 mb-1" />
            <span>Explore</span>
          </Link>
          <Link
            to="/portfolio"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/portfolio") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className="text-base font-semibold mb-1">
              {formatPortfolioValue(portfolioData?.totalValue || 0)}
            </span>
            <span>Portfolio</span>
          </Link>
          <Link
            to="/profile"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/profile") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5 mb-1" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
