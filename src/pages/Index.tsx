
import { useState, useEffect } from "react";
import { Stock, generateStockBatch } from "@/lib/mockStocks";
import { Portfolio } from "@/components/Portfolio";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { StockSwiper } from "@/components/stocks/StockSwiper";
import { useStockCache } from "@/hooks/use-stock-cache";
import { useToast } from "@/hooks/use-toast";

interface IndexProps {
  showPortfolio?: boolean;
}

const Index = ({ showPortfolio: initialShowPortfolio = false }: IndexProps) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(initialShowPortfolio);
  const { toast } = useToast();

  // Initialize stock cache
  useStockCache();

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

  // Update showPortfolio when prop changes
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
            <motion.div
              key="swiper"
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative h-[calc(100%-4rem)]"
            >
              <StockSwiper 
                stocks={stocks.slice(1)} 
                onLoadMore={loadStocks} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
