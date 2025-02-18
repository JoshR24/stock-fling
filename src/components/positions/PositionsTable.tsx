
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Position, StockPrice } from "./types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface PositionsTableProps {
  positions: Position[];
  stockPrices: StockPrice[];
}

export const PositionsTable = ({ positions, stockPrices }: PositionsTableProps) => {
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleTrade = async (position: Position, stockPrice: StockPrice, type: 'buy' | 'sell') => {
    if (!quantity || isNaN(Number(quantity))) {
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

      const totalAmount = Number(quantity) * stockPrice.currentPrice;

      if (type === 'buy' && totalAmount > balanceData.balance) {
        toast({
          title: "Insufficient funds",
          description: "You don't have enough balance for this trade",
          variant: "destructive",
        });
        return;
      }

      if (type === 'sell' && Number(quantity) > position.quantity) {
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
          symbol: position.symbol,
          transaction_type: type,
          quantity: Number(quantity),
          price: stockPrice.currentPrice,
          total_amount: totalAmount,
        });

      if (transactionError) throw transactionError;

      // Update position
      const newQuantity = type === 'buy' 
        ? position.quantity + Number(quantity)
        : position.quantity - Number(quantity);

      if (newQuantity === 0) {
        await supabase
          .from('paper_trading_positions')
          .delete()
          .eq('symbol', position.symbol)
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
          .eq('symbol', position.symbol)
          .eq('user_id', user.id);
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
        description: `Successfully ${type === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${position.symbol}`,
      });

      setQuantity("");
      setExpandedPosition(null);
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
    <div className="overflow-x-auto -mx-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Symbol</TableHead>
            <TableHead className="text-xs text-right">Qty</TableHead>
            <TableHead className="text-xs text-right">Price</TableHead>
            <TableHead className="text-xs text-right">Gain/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => {
            const stockPrice = stockPrices.find(s => s.symbol === position.symbol);
            if (!stockPrice) return null;

            const currentValue = position.quantity * stockPrice.currentPrice;
            const costBasis = position.quantity * position.average_price;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = costBasis !== 0 ? (gainLoss / costBasis) * 100 : 0;
            const isExpanded = expandedPosition === position.symbol;

            return (
              <>
                <TableRow 
                  key={position.symbol}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setExpandedPosition(isExpanded ? null : position.symbol)}
                >
                  <TableCell className="font-medium text-xs py-2">
                    <div className="flex items-center gap-1">
                      {position.symbol}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs py-2">{position.quantity}</TableCell>
                  <TableCell className="text-right text-xs py-2">${stockPrice.currentPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs py-2">
                    <div className="flex items-center justify-end gap-1">
                      <span>${Math.abs(gainLoss).toFixed(2)}</span>
                      <Badge variant={gainLoss >= 0 ? "default" : "destructive"} className="text-[10px] px-1 py-0">
                        {gainLoss >= 0 ? "+" : "-"}{Math.abs(gainLossPercent).toFixed(1)}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-4 bg-accent">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleTrade(position, stockPrice, 'buy')}
                          >
                            <Plus className="h-4 w-4" />
                            Buy More
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTrade(position, stockPrice, 'sell')}
                          >
                            <Minus className="h-4 w-4" />
                            Sell
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Average Cost: ${position.average_price.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
