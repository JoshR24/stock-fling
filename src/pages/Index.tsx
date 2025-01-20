import { useState, useCallback } from "react";
import { Stock, generateStockBatch } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { Portfolio } from "@/components/Portfolio";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [stocks, setStocks] = useState<Stock[]>(() => generateStockBatch(5));
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const { toast } = useToast();

  const handleSwipe = useCallback((direction: "left" | "right") => {
    setStocks((prev) => {
      const [current, ...rest] = prev;
      if (direction === "right") {
        setPortfolio((portfolio) => [...portfolio, current]);
        toast({
          title: "Added to Portfolio",
          description: `${current.symbol} has been added to your portfolio.`,
        });
      }
      return [...rest, generateStockBatch(1)[0]];
    });
  }, [toast]);

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