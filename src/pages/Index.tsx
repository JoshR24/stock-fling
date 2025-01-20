import { useState, useCallback, useEffect } from "react";
import { StockData, generateStockBatch, getRandomStock } from "@/lib/stockApi";
import { StockCard } from "@/components/StockCard";
import { Portfolio } from "@/components/Portfolio";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [portfolio, setPortfolio] = useState<StockData[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadInitialStocks = async () => {
      try {
        const initialStocks = await generateStockBatch(5);
        setStocks(initialStocks);
      } catch (error) {
        console.error('Error loading stocks:', error);
        toast({
          title: "Error",
          description: "Failed to load stock data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialStocks();
  }, [toast]);

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    setStocks((prev) => {
      const [current, ...rest] = prev;
      if (direction === "right") {
        setPortfolio((portfolio) => [...portfolio, current]);
        toast({
          title: "Added to Portfolio",
          description: `${current.symbol} has been added to your portfolio.`,
        });
      }
      return rest;
    });

    // Fetch a new stock to replace the one that was swiped
    try {
      const newStock = await getRandomStock();
      setStocks(prev => [...prev, newStock]);
    } catch (error) {
      console.error('Error fetching new stock:', error);
      toast({
        title: "Error",
        description: "Failed to load new stock data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              <AnimatePresence>
                {stocks.slice(0, 1).map((stock) => (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    onSwipe={handleSwipe}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;