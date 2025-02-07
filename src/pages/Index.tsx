
import { useState, useEffect } from "react";
import { Stock } from "@/lib/mockStocks";
import { Portfolio } from "@/components/Portfolio";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { StockSwiper } from "@/components/StockSwiper";
import { useStocks } from "@/hooks/useStocks";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface IndexProps {
  showPortfolio?: boolean;
}

const Index = ({ showPortfolio: initialShowPortfolio = false }: IndexProps) => {
  const [showPortfolio, setShowPortfolio] = useState(initialShowPortfolio);
  const { stocks, loadStocks, handleSwipe } = useStocks();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking auth status:', error);
        toast({
          title: "Authentication Error",
          description: "Please try logging in again.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }
      
      if (!session) {
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Fetch positions data using React Query
  const { data: positionsData } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      console.log('Fetching positions for user:', user.id);
      
      const { data, error } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching positions:', error);
        throw error;
      }

      console.log('Fetched positions:', data);
      return data || [];
    },
  });

  // Load initial stocks on mount or when positions change
  useEffect(() => {
    loadStocks();
  }, [positionsData, showPortfolio]);

  // Map positions symbols to stock objects
  const portfolioStocks = stocks.filter(stock => 
    positionsData?.some(position => position.symbol === stock.symbol)
  );

  console.log('Current stocks:', stocks);
  console.log('Portfolio stocks:', portfolioStocks);

  useEffect(() => {
    setShowPortfolio(initialShowPortfolio);
  }, [initialShowPortfolio]);

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-md mx-auto h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {showPortfolio ? "Portfolio" : "Stockr"}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {showPortfolio ? (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-[calc(100%-4rem)]"
            >
              <Portfolio stocks={stocks} />
            </motion.div>
          ) : (
            <StockSwiper stocks={stocks} onSwipe={handleSwipe} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
