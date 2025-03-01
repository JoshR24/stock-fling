
import { Stock } from "@/lib/mockStocks";
import { Button } from "../ui/button";
import { X, ShoppingCart, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface StockCardBackProps {
  stock: Stock;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

export const StockCardBack = ({ stock, onClose, onPurchaseComplete }: StockCardBackProps) => {
  const [quantity, setQuantity] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddToPortfolio = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save to portfolio.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('portfolios')
        .insert({ 
          symbol: stock.symbol,
          user_id: user.id
        });

      if (error) {
        console.error('Error saving to portfolio:', error);
        toast({
          title: "Error",
          description: "Failed to save stock to portfolio. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Added to Portfolio",
        description: `${stock.symbol} has been added to your portfolio.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error in handleAddToPortfolio:', error);
      toast({
        title: "Error",
        description: "Failed to save stock to portfolio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyStock = async () => {
    try {
      setIsLoading(true);
      const numQuantity = Number(quantity);
      
      if (isNaN(numQuantity) || numQuantity <= 0) {
        toast({
          title: "Invalid quantity",
          description: "Please enter a valid number of shares",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
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

      if (balanceError || !balanceData) {
        toast({
          title: "Account error",
          description: "Could not find your trading balance",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = numQuantity * stock.price;

      if (totalAmount > balanceData.balance) {
        toast({
          title: "Insufficient funds",
          description: "You don't have enough balance for this trade",
          variant: "destructive",
        });
        return;
      }

      // Check if position already exists
      const { data: existingPosition, error: positionError } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', stock.symbol)
        .maybeSingle();

      if (positionError) throw positionError;

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('paper_trading_transactions')
        .insert({
          user_id: user.id,
          symbol: stock.symbol,
          transaction_type: 'buy',
          quantity: numQuantity,
          price: stock.price,
          total_amount: totalAmount,
        });

      if (transactionError) throw transactionError;

      // Update position - fixed calculation logic
      if (existingPosition) {
        // Calculate new quantity and average price properly
        const newQuantity = parseFloat(existingPosition.quantity) + numQuantity;
        
        // Calculate new average price: ((old_qty * old_avg_price) + (new_qty * new_price)) / total_qty
        const newAveragePrice = (
          (parseFloat(existingPosition.quantity) * parseFloat(existingPosition.average_price)) + 
          (numQuantity * stock.price)
        ) / newQuantity;

        console.log('Updating position with:', {
          oldQty: parseFloat(existingPosition.quantity),
          newQty: numQuantity,
          totalQty: newQuantity,
          oldAvgPrice: parseFloat(existingPosition.average_price),
          newPrice: stock.price,
          newAvgPrice: newAveragePrice
        });

        const { error: updateError } = await supabase
          .from('paper_trading_positions')
          .update({ 
            quantity: newQuantity,
            average_price: newAveragePrice,
          })
          .eq('id', existingPosition.id);

        if (updateError) throw updateError;
      } else {
        // Create new position
        const { error: insertError } = await supabase
          .from('paper_trading_positions')
          .insert({
            user_id: user.id,
            symbol: stock.symbol,
            quantity: numQuantity,
            average_price: stock.price,
          });

        if (insertError) throw insertError;
      }

      // Update balance
      const { error: balanceUpdateError } = await supabase
        .from('paper_trading_balances')
        .update({
          balance: balanceData.balance - totalAmount
        })
        .eq('user_id', user.id);

      if (balanceUpdateError) throw balanceUpdateError;

      // Invalidate queries to trigger a refresh of the UI
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-value'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });

      toast({
        title: "Purchase successful",
        description: `You bought ${numQuantity} shares of ${stock.symbol}`,
      });

      onPurchaseComplete();
    } catch (error) {
      console.error('Error in buyStock:', error);
      toast({
        title: "Trade failed",
        description: "There was an error executing your trade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg flex flex-col space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{stock.symbol}</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="text-center space-y-2 flex-1 flex flex-col justify-center">
        <div className="text-2xl font-bold">${stock.price.toFixed(2)}</div>
        <div className="mb-4 text-muted-foreground">{stock.name}</div>
        
        <div className="flex flex-col space-y-3 max-w-xs mx-auto">
          <div className="flex items-center">
            <label className="w-20 text-sm">Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="text-lg font-medium mt-2">
            Total: ${(Number(quantity) * stock.price).toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleBuyStock}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
        >
          <ShoppingCart className="h-4 w-4" />
          Buy Now
        </Button>
        
        <Button
          onClick={handleAddToPortfolio}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md"
        >
          <Plus className="h-4 w-4" />
          Add to Portfolio
        </Button>
      </div>
    </div>
  );
};
