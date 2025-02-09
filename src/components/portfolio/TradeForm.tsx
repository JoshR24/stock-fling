
import { useState } from "react";
import { Stock } from "@/lib/mockStocks";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TradeFormProps {
  selectedStock: Stock;
  onTrade: () => void;
}

export const TradeForm = ({ selectedStock, onTrade }: TradeFormProps) => {
  const [quantity, setQuantity] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!selectedStock || !quantity || isNaN(Number(quantity))) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
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

      if (balanceError || !balanceData) {
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

      // Invalidate queries to trigger a refresh of the UI
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });

      toast({
        title: "Trade executed",
        description: `Successfully ${type === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedStock.symbol}`,
      });

      setQuantity("");
      onTrade();
    } catch (error) {
      console.error('Trade error:', error);
      toast({
        title: "Trade failed",
        description: "There was an error executing your trade",
        variant: "destructive",
      });
    }
  };

  return (
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
  );
};
