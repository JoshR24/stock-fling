import { useState, useCallback, useEffect } from "react";
import { Stock, generateStockBatch } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { Portfolio } from "@/components/Portfolio";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { LogOut } from "lucide-react";

const Index = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

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

  const loadPortfolio = async () => {
    if (!session?.user) return;
    
    try {
      const { data: portfolioData, error } = await supabase
        .from("portfolios")
        .select("symbol")
        .eq("user_id", session.user.id);

      if (error) throw error;

      const portfolioStocks = await Promise.all(
        portfolioData.map(async (item) => {
          try {
            const stockData = await generateStockBatch(1, item.symbol);
            return stockData[0];
          } catch (error) {
            console.error(`Error loading stock ${item.symbol}:`, error);
            return null;
          }
        })
      );

      setPortfolio(portfolioStocks.filter((stock): stock is Stock => stock !== null));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load portfolio. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadStocks();
      loadPortfolio();
    }
  }, [session?.user]);

  const handleSwipe = useCallback(async (direction: "left" | "right", stock: Stock) => {
    if (!session?.user) return;

    setStocks((prev) => prev.filter(s => s.id !== stock.id));

    if (direction === "right") {
      try {
        const { error } = await supabase
          .from("portfolios")
          .insert({ user_id: session.user.id, symbol: stock.symbol });

        if (error) throw error;

        setPortfolio((prev) => {
          if (!prev.find(s => s.symbol === stock.symbol)) {
            return [...prev, stock];
          }
          return prev;
        });

        toast({
          title: "Added to Portfolio",
          description: `${stock.symbol} has been added to your portfolio.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add stock to portfolio. Please try again.",
          variant: "destructive",
        });
      }
    }

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
  }, [stocks.length, toast, session?.user, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto h-[calc(100vh-2rem)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Stockr</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowPortfolio(!showPortfolio)}
            >
              {showPortfolio ? "Back to Swiping" : "View Portfolio"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
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
                      onSwipe={(direction) => handleSwipe(direction, stock)}
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