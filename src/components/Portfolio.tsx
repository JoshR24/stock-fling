import { Stock } from "@/lib/mockStocks";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { DollarSign, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioPositions } from "./positions/PortfolioPositions";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [portfolioStocks, setPortfolioStocks] = useState<Stock[]>([]);
  const { toast } = useToast();

  // Fetch user's portfolio and balance
  useEffect(() => {
    const fetchPortfolioAndBalance = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return;
      }

      // Fetch balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('paper_trading_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError) {
        console.error('Error fetching balance:', balanceError);
        return;
      }

      if (balanceData) {
        setBalance(balanceData.balance);
      }

      // Fetch portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('symbol')
        .eq('user_id', user.id);

      if (portfolioError) {
        console.error('Error fetching portfolio:', portfolioError);
        return;
      }

      // Map portfolio symbols to actual stock data
      const portfolioSymbols = new Set(portfolioData.map(item => item.symbol));
      const portfolioStocks = stocks.filter(stock => portfolioSymbols.has(stock.symbol));
      setPortfolioStocks(portfolioStocks);
    };

    fetchPortfolioAndBalance();
  }, [stocks]);

  const handleStockSelect = async (stock: Stock) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add stocks to your portfolio",
          variant: "destructive",
        });
        return;
      }

      // Check if stock is already in portfolio
      const { data: existingStock, error: checkError } = await supabase
        .from('portfolios')
        .select('symbol')
        .eq('user_id', user.id)
        .eq('symbol', stock.symbol)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (!existingStock) {
        // Add to portfolio
        const { error: insertError } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.id,
            symbol: stock.symbol
          });

        if (insertError) {
          throw insertError;
        }

        setPortfolioStocks(prev => [...prev, stock]);
        toast({
          title: "Added to portfolio",
          description: `${stock.symbol} has been added to your portfolio`,
        });
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to update portfolio",
        variant: "destructive",
      });
    }
    setSelectedStock(stock);
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!selectedStock || !quantity || isNaN(Number(quantity))) {
      toast({
        title: "Invalid input",
        description: "Please select a stock and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to trade",
          variant: "destructive",
        });
        return;
      }

      const { data: balanceData, error: balanceError } = await supabase
        .from('paper_trading_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError) throw balanceError;
      if (!balanceData) {
        toast({
          title: "Account error",
          description: "Could not find your trading balance",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = Number(quantity) * selectedStock.price;

      if (type === 'buy' && totalAmount > balanceData.balance) {
        toast({
          title: "Insufficient funds",
          description: "You don't have enough balance for this trade",
          variant: "destructive",
        });
        return;
      }

      // Start transaction
      const { data: position, error: positionError } = await supabase
        .from('paper_trading_positions')
        .select('quantity, average_price')
        .eq('symbol', selectedStock.symbol)
        .eq('user_id', user.id)
        .maybeSingle();

      if (positionError) throw positionError;

      if (type === 'sell' && (!position || Number(quantity) > position.quantity)) {
        toast({
          title: "Invalid sell order",
          description: "You don't have enough shares to sell",
          variant: "destructive",
        });
        return;
      }

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('paper_trading_transactions')
        .insert({
          user_id: user.id,
          symbol: selectedStock.symbol,
          transaction_type: type,
          quantity: Number(quantity),
          price: selectedStock.price,
          total_amount: totalAmount,
        });

      if (transactionError) throw transactionError;

      // Update position
      if (position) {
        const newQuantity = type === 'buy' 
          ? position.quantity + Number(quantity)
          : position.quantity - Number(quantity);

        if (newQuantity === 0) {
          await supabase
            .from('paper_trading_positions')
            .delete()
            .eq('symbol', selectedStock.symbol)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('paper_trading_positions')
            .update({ 
              quantity: newQuantity,
              average_price: type === 'buy'
                ? ((position.quantity * position.average_price) + totalAmount) / newQuantity
                : position.average_price,
              user_id: user.id
            })
            .eq('symbol', selectedStock.symbol)
            .eq('user_id', user.id);
        }
      } else if (type === 'buy') {
        await supabase
          .from('paper_trading_positions')
          .insert({
            user_id: user.id,
            symbol: selectedStock.symbol,
            quantity: Number(quantity),
            average_price: selectedStock.price,
          });
      }

      // Update balance
      await supabase
        .from('paper_trading_balances')
        .update({
          balance: type === 'buy'
            ? balanceData.balance - totalAmount
            : balanceData.balance + totalAmount
        })
        .eq('user_id', user.id);

      toast({
        title: "Trade executed",
        description: `Successfully ${type === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedStock.symbol}`,
      });

      setQuantity("");
      setSelectedStock(null);
    } catch (error) {
      console.error('Trade error:', error);
      toast({
        title: "Trade failed",
        description: "There was an error executing your trade",
        variant: "destructive",
      });
    }
  };

  if (stocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No stocks in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span>Available Cash</span>
          </div>
          <span className="text-2xl font-bold">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </Card>

        <PortfolioPositions stocks={portfolioStocks} />

        {selectedStock && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold mb-4">Trade {selectedStock.symbol}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Quantity</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleTrade('buy')}
                >
                  <Plus className="h-4 w-4" />
                  Buy
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleTrade('sell')}
                >
                  <Minus className="h-4 w-4" />
                  Sell
                </Button>
              </div>
            </div>
          </Card>
        )}

        {stocks.map((stock) => (
          <Card 
            key={stock.id} 
            className="p-4 glass-card cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleStockSelect(stock)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{stock.symbol}</h3>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
              <Badge variant={stock.change >= 0 ? "default" : "destructive"}>
                {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(1)}%
              </Badge>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stock.chartData}>
                  <defs>
                    <linearGradient id={`color${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={stock.change >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={stock.change >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={stock.change >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                    fillOpacity={1}
                    fill={`url(#color${stock.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
