import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockNews } from "@/components/stock/StockNews";
import { generateStockBatch } from "@/lib/mockStocks";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Sparkles, PlusCircle } from "lucide-react";
import { StockCard } from "@/components/StockCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const companyData = [
  { symbol: "AAPL", name: "Apple Inc.", change: 2.5 },
  { symbol: "GOOGL", name: "Alphabet Inc.", change: -1.2 },
  { symbol: "MSFT", name: "Microsoft Corporation", change: 1.8 },
  { symbol: "AMZN", name: "Amazon.com Inc.", change: 0.9 },
  { symbol: "META", name: "Meta Platforms Inc.", change: -0.7 },
  { symbol: "TSLA", name: "Tesla Inc.", change: 3.2 },
  { symbol: "NVDA", name: "NVIDIA Corporation", change: 4.1 }
];

interface AIRecommendation {
  symbol: string;
  name: string;
  reason: string;
}

const Explore = () => {
  const [stock, setStock] = useState<any>(null);
  const [recentNews, setRecentNews] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof companyData>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialNews();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = companyData.filter(company => 
        company.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const loadInitialNews = async () => {
    try {
      const stocks = await generateStockBatch(1);
      setRecentNews(stocks[0]);
    } catch (error) {
      console.error('Failed to load initial news:', error);
    }
  };

  const loadStockData = async (symbol: string) => {
    try {
      const stocks = await generateStockBatch(1);
      const companyInfo = companyData.find(company => company.symbol === symbol);
      if (companyInfo) {
        setStock({
          ...stocks[0],
          symbol: companyInfo.symbol,
          name: companyInfo.name,
          change: companyInfo.change,
        });
        setSearchQuery("");
        setSuggestions([]);
      }
      toast({
        title: "Stock Loaded",
        description: `Successfully loaded data for ${symbol}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setStock(null);
    setSearchQuery("");
    setSuggestions([]);
    setAiRecommendations([]);
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

  const getAIRecommendations = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter an investment idea or market sentiment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('getAIStockRecommendations', {
        body: { prompt: aiPrompt },
      });

      if (error) throw error;

      setAiRecommendations(data.recommendations);
      toast({
        title: "AI Recommendations Ready",
        description: "Here are your personalized stock recommendations!",
      });
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get AI recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-4">
          {(stock || aiRecommendations.length > 0) && (
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
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search stocks or companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {suggestions.length > 0 && (
                  <Card className="absolute w-full mt-1 z-50">
                    <ScrollArea className="max-h-[200px]">
                      {suggestions.map((company) => (
                        <button
                          key={company.symbol}
                          className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
                          onClick={() => {
                            loadStockData(company.symbol);
                          }}
                        >
                          <div>
                            <div className="font-medium">{company.symbol}</div>
                            <div className="text-sm text-muted-foreground">{company.name}</div>
                          </div>
                          <span className={`text-sm ${company.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {company.change >= 0 ? '+' : ''}{company.change.toFixed(1)}%
                          </span>
                        </button>
                      ))}
                    </ScrollArea>
                  </Card>
                )}
              </div>

              <Card className="p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">AI Portfolio Recommendations</h3>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Describe your investment idea or market sentiment (e.g., 'I think renewable energy will grow significantly')"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button 
                      onClick={getAIRecommendations}
                      disabled={isLoadingAI}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isLoadingAI ? "Analyzing..." : "Get AI Recommendations"}
                    </Button>
                  </div>

                  {aiRecommendations.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h4 className="font-medium">Recommended Stocks:</h4>
                      {aiRecommendations.map((rec, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{rec.symbol}</h5>
                              <p className="text-sm text-muted-foreground">{rec.name}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadStockData(rec.symbol)}
                            >
                              View
                            </Button>
                          </div>
                          <p className="text-sm mt-2">{rec.reason}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
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

          {!stock && !aiRecommendations.length && (
            <ScrollArea className="h-[calc(100vh-24rem)]">
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
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;