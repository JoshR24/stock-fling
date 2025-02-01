import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateStockBatch } from "@/lib/mockStocks";
import { SearchForm } from "./recommendations/SearchForm";
import { RecommendationsList } from "./recommendations/RecommendationsList";
import { StockDetailView } from "./recommendations/StockDetailView";

export const AIRecommendations = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('getAIStockRecommendations', {
        body: { prompt },
      });

      if (error) throw error;

      setRecommendations(data.recommendations);
      toast({
        title: "Recommendations Ready",
        description: "Here are your AI-powered stock recommendations.",
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStock = async (symbol: string) => {
    try {
      const stocks = await generateStockBatch(1);
      const stock = {
        ...stocks[0],
        symbol: symbol,
      };
      setSelectedStock(stock);
    } catch (error) {
      console.error('Error loading stock:', error);
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToPortfolio = async (symbol: string) => {
    try {
      const { error } = await supabase
        .from('portfolios')
        .insert([{ 
          symbol,
          user_id: '00000000-0000-0000-0000-000000000000'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${symbol} has been added to your portfolio.`,
        duration: 500, // Reduced from 1000 to 500 milliseconds
      });
      
      // Automatically close the stock detail view after a very short delay
      setTimeout(() => {
        setSelectedStock(null);
      }, 50); // Reduced from 100 to 50 milliseconds
      
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right" && selectedStock) {
      handleAddToPortfolio(selectedStock.symbol);
    } else {
      // Close the detail view for left swipes or when no action is taken
      setTimeout(() => {
        setSelectedStock(null);
      }, 50); // Reduced from 100 to 50 milliseconds
    }
  };

  return (
    <div className="space-y-4">
      <SearchForm
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {selectedStock && (
        <StockDetailView
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onAddToPortfolio={handleAddToPortfolio}
          onSwipe={handleSwipe}
        />
      )}

      {recommendations.length > 0 && !selectedStock && (
        <RecommendationsList
          recommendations={recommendations}
          onViewStock={handleViewStock}
          onAddToPortfolio={handleAddToPortfolio}
        />
      )}
    </div>
  );
};