import { Stock } from "@/lib/mockStocks";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useState } from "react";
import { Input } from "./ui/input";
import { DollarSign, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const { toast } = useToast();

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
      const { data: balanceData, error: balanceError } = await supabase
        .from('paper_trading_balances')
        .select('balance')
        .single();

      if (balanceError) throw balanceError;

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
        .select('quantity')
        .eq('symbol', selectedStock.symbol)
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
            .eq('symbol', selectedStock.symbol);
        } else {
          await supabase
            .from('paper_trading_positions')
            .update({ 
              quantity: newQuantity,
              average_price: type === 'buy'
                ? ((position.quantity * position.average_price) + totalAmount) / newQuantity
                : position.average_price
            })
            .eq('symbol', selectedStock.symbol);
        }
      } else if (type === 'buy') {
        await supabase
          .from('paper_trading_positions')
          .insert({
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
        });

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
        <div className="flex items-center gap-4 mb-6">
          <Card className="p-4 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span>Available Balance</span>
            </div>
            <span className="text-2xl font-bold">$100,000.00</span>
          </Card>
        </div>

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
            onClick={() => setSelectedStock(stock)}
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