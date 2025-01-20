import { useState, useCallback, useEffect } from "react";
import { Stock, generateStockBatch } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { Portfolio } from "@/components/Portfolio";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadStocks = async () => {
    try {
      setIsLoading(true);
      const newStocks = await generateStockBatch(5);
      setStocks(prev => {
        const existingSymbols = new Set(prev.map(s => s.symbol));
        return [...prev, ...newStocks.filter(s => !existingSymbols.has(s.symbol))];
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedPortfolio = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate('/auth');
        return;
      }

      const { data: portfolioData, error } = await supabase
        .from('portfolios')
        .select('symbol')
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      if (portfolioData) {
        const savedSymbols = portfolioData.map(item => item.symbol);
        const portfolioStocks = await Promise.all(
          savedSymbols.map(async (symbol) => {
            // Fix: Pass only one argument to generateStockBatch
            const stockData = await generateStockBatch(1);
            return stockData[0];
          })
        );
        setPortfolio(portfolioStocks);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to load your portfolio. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadStocks();
    loadSavedPortfolio();
  }, []);

  const handleSwipe = useCallback(async (direction: "left" | "right", stock?: Stock) => {
    if (!stock) return;
    
    // Move the async operation outside of setStocks
    if (direction === "right") {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          navigate('/auth');
          return;
        }

        const { error } = await supabase
          .from('portfolios')
          .insert([{ 
            user_id: session.session.user.id,
            symbol: stock.symbol
          }]);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to save to portfolio. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setPortfolio((portfolio) => {
          if (!portfolio.find(s => s.symbol === stock.symbol)) {
            return [...portfolio, stock];
          }
          return portfolio;
        });
        
        toast({
          title: "Added to Portfolio",
          description: `${stock.symbol} has been added to your portfolio.`,
        });
      } catch (error) {
        console.error('Error saving to portfolio:', error);
        return;
      }
    }

    setStocks((prev) => {
      const [, ...rest] = prev;
      return rest;
    });

    if (stocks.length <= 2) {
      try {
        await loadStocks();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load more stocks. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [stocks.length, toast, navigate]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto h-[calc(100vh-2rem)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Stockr</h1>
          <Button
            variant="ghost"
            onClick={() => setShowPortfolio(!showPortfolio)}
          >
            {showPortfolio ? "Back to Swiping" : "View Portfolio"}
          </Button>
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
              <Portfolio stocks={portfolio} />
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
              {isLoading ? (
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