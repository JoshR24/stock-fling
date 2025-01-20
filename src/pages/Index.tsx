import { useState, useCallback, useEffect } from "react";
import { Stock, generateStockBatch } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { Portfolio } from "@/components/Portfolio";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface IndexProps {
  showPortfolio?: boolean;
}

const Index = ({ showPortfolio: initialShowPortfolio = false }: IndexProps) => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(initialShowPortfolio);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setShowPortfolio(initialShowPortfolio);
  }, [initialShowPortfolio]);

  const loadStocks = async () => {
    try {
      setIsLoading(true);
      const newStocks = await generateStockBatch(5);
      setStocks(prev => {
        // Filter out any stocks that might already be in the list
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

  useEffect(() => {
    loadStocks();
  }, []);

  const handleSwipe = useCallback(async (direction: "left" | "right") => {
    setStocks((prev) => {
      const [current, ...rest] = prev;
      if (direction === "right") {
        setPortfolio((portfolio) => {
          // Prevent duplicates in portfolio
          if (!portfolio.find(s => s.symbol === current.symbol)) {
            return [...portfolio, current];
          }
          return portfolio;
        });
        toast({
          title: "Added to Portfolio",
          description: `${current.symbol} has been added to your portfolio.`,
        });
      }
      return rest;
    });

    // Load more stocks when we're running low
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
  }, [stocks.length, toast]);

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-md mx-auto h-[calc(100vh-8rem)]">
        <h1 className="text-2xl font-bold mb-4">
          {showPortfolio ? "Portfolio" : "Stockr"}
        </h1>

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
