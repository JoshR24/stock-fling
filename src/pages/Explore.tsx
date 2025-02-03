import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockNews } from "@/components/stock/StockNews";
import { generateStockBatch } from "@/lib/mockStocks";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { StockCard } from "@/components/StockCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StockSearch } from "@/components/explore/StockSearch";
import { AIRecommendations } from "@/components/explore/AIRecommendations";
import { StockCategories } from "@/components/explore/StockCategories";
import { StockDataCacheEntry } from "@/integrations/supabase/types";

const Explore = () => {
  const [stock, setStock] = useState<any>(null);
  const [recentNews, setRecentNews] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialNews();
  }, []);

  const loadInitialNews = async () => {
    try {
      const stocks = await generateStockBatch();
      setRecentNews(stocks[0]);
    } catch (error) {
      console.error('Failed to load initial news:', error);
    }
  };

  const loadStockData = async (symbol: string) => {
    try {
      const { data: stockData, error } = await supabase
        .from('stock_data_cache')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (error) throw error;

      const data = stockData.data as StockDataCacheEntry;
      const formattedStock = {
        id: stockData.symbol,
        symbol: stockData.symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        description: data.description,
        news: data.news,
        chartData: data.chartData?.map((point) => ({
          value: point.value
        }))
      };

      setStock(formattedStock);
      
      toast({
        title: "Stock Loaded",
        description: `Successfully loaded data for ${symbol}`,
      });
    } catch (error) {
      console.error('Error loading stock:', error);
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setStock(null);
  };

  const handleAddToPortfolio = async (symbol: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add stocks to your portfolio.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('portfolios')
        .insert([{ 
          symbol,
          user_id: user.id 
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${symbol} has been added to your portfolio.`,
      });
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          {stock && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="p-0 hover:bg-transparent"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">Explore</h1>
        </div>
        
        <div className="space-y-4">
          {!stock && (
            <>
              <StockSearch onStockSelect={loadStockData} />
              <AIRecommendations onStockSelect={loadStockData} />
              <StockCategories />
            </>
          )}

          {stock && (
            <div className="fixed inset-0 bg-background p-4 overflow-auto">
              <div className="max-w-md mx-auto relative min-h-full pb-16">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => handleAddToPortfolio(stock.symbol)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add to Portfolio
                </Button>
                <StockCard 
                  stock={stock} 
                  onSwipe={(direction) => {
                    console.log(`Swiped ${direction}`);
                  }} 
                />
                <Card className="p-4 mt-4">
                  <StockNews stock={stock} />
                </Card>
              </div>
            </div>
          )}

          {!stock && (
            <div className="mt-4">
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4">Recent Market News</h3>
                {recentNews ? (
                  <StockNews stock={recentNews} />
                ) : (
                  <p className="text-muted-foreground text-center">
                    Loading recent market news...
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;