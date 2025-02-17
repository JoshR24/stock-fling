
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockSearch } from "@/components/explore/StockSearch";
import { StockCategories } from "@/components/explore/StockCategories";
import { AIRecommendations } from "@/components/explore/AIRecommendations";
import { StockDetailView } from "@/components/recommendations/StockDetailView";
import { StockNewsSection } from "@/components/explore/StockNewsSection";
import { useExploreStocks } from "@/hooks/useExploreStocks";
import { usePortfolioActions } from "@/components/explore/PortfolioActions";

const Explore = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  
  const { stockData } = useExploreStocks(selectedCategory);
  const { handleAddToPortfolio } = usePortfolioActions({
    onSuccess: () => setSelectedStock(null)
  });

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
  };

  const handleBackClick = () => {
    setSelectedStock(null);
  };

  // Find the full stock data for the selected stock
  const selectedStockData = stockData?.find(s => s.symbol === selectedStock);
  const stockForDetail = selectedStockData 
    ? { 
        ...selectedStockData,
        description: selectedStockData.description || `No description available for ${selectedStockData.symbol}`,
        chartData: selectedStockData.chartData || []
      }
    : null;

  return (
    <div className="h-full">
      {selectedStock && stockForDetail ? (
        <StockDetailView
          stock={stockForDetail}
          onClose={handleBackClick}
          onAddToPortfolio={handleAddToPortfolio}
          onSwipe={() => {}} // No-op since we don't need swipe functionality here
        />
      ) : (
        <>
          <StockSearch onSelect={handleStockSelect} />
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <StockCategories 
                selectedCategory={selectedCategory || ""} 
                onSelectCategory={(category) => setSelectedCategory(category)} 
              />
              <AIRecommendations onStockSelect={handleStockSelect} />
              {stockData && <StockNewsSection stocks={stockData} />}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};

export default Explore;
