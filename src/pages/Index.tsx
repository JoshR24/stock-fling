import { useState, useCallback, useEffect } from "react";
import { Stock, generateStockBatch } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { Portfolio } from "@/components/Portfolio";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface IndexProps {
  showPortfolio?: boolean;
}

const Index = ({ showPortfolio: initialShowPortfolio = false }: IndexProps) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(initialShowPortfolio);
  const { toast } = useToast();

  // Function to initialize the stock cache
  const initializeStockCache = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetchStockData', {
        body: { initialize: true }
      });

      if (error) throw error;
      console.log('Cache initialization response:', data);
    } catch (error) {
      console.error('Error initializing cache:', error);
      toast({
        title: "Error",
        description: "Failed to initialize stock cache. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Initialize cache when component mounts
  useEffect(() => {
    initializeStockCache();
  }, []);

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

  // Load initial stocks

  // Load initial stocks
  const loadStocks = async () => {
    try {
      const newStocks = await generateStockBatch();
      setStocks(prev => {
        const existingSymbols = new Set(prev.map(s => s.symbol));
        return [...prev, ...newStocks.filter(s => !existingSymbols.has(s.symbol))];
      });
    } catch (error) {
      console.error('Error loading stocks:', error);
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    setStocks((prev) => {
      const [current, ...rest] = prev;
      if (direction === "right" && current) {
        // Save to Supabase
        const saveToPortfolio = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
              toast({
                title: "Error",
                description: "You must be logged in to save to portfolio.",
                variant: "destructive",
              });
              return;
            }

            const { error } = await supabase
              .from('portfolios')
              .insert({ 
                symbol: current.symbol,
                user_id: user.id
              });

            if (error) {
              console.error('Error saving to portfolio:', error);
              toast({
                title: "Error",
                description: "Failed to save stock to portfolio. Please try again.",
                variant: "destructive",
              });
              return;
            }

            toast({
              title: "Added to Portfolio",
              description: `${current.symbol} has been added to your portfolio.`,
            });
          } catch (error) {
            console.error('Error in saveToPortfolio:', error);
            toast({
              title: "Error",
              description: "Failed to save stock to portfolio. Please try again.",
              variant: "destructive",
            });
          }
        };

        saveToPortfolio();
      }
      return rest;
    });

    if (stocks.length <= 2) {
      await loadStocks();
    }
  }, [stocks.length, toast]);

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
            <motion.div
              key="swiper"
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative h-[calc(100%-4rem)]"
            >
              {stocks.length === 0 ? (
                <div className="w-full h-full">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ) : (
                <AnimatePresence>
                  {stocks.slice(0, 1).map((stock) => (
                    <StockCard
                      key={stock.id}
                      stock={stock}
                      onSwipe={handleSwipe}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
