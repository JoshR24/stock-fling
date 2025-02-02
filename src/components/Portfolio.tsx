import { useState, useEffect } from "react";
import { Stock } from "@/lib/mockStocks";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioPositions } from "./positions/PortfolioPositions";
import { AvailableCash } from "./portfolio/AvailableCash";
import { TradeForm } from "./portfolio/TradeForm";
import { StockList } from "./portfolio/StockList";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface PortfolioProps {
  stocks: Stock[];
}

export const Portfolio = ({ stocks }: PortfolioProps) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [portfolioStocks, setPortfolioStocks] = useState<Stock[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [supportEmail, setSupportEmail] = useState("support@stockfling.com");
  const { toast } = useToast();

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

    // Fetch portfolio positions
    const { data: positionsData, error: positionsError } = await supabase
      .from('paper_trading_positions')
      .select('symbol, quantity, average_price')
      .eq('user_id', user.id);

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
      return;
    }

    const portfolioSymbols = new Set(positionsData.map(item => item.symbol));
    const portfolioStocks = stocks.filter(stock => portfolioSymbols.has(stock.symbol));
    setPortfolioStocks(portfolioStocks);
  };

  const fetchSupportInfo = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('support_email')
      .single();

    if (!error && data) {
      setSupportEmail(data.support_email);
    }
  };

  useEffect(() => {
    fetchPortfolioAndBalance();
    fetchSupportInfo();
  }, [stocks]);

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleTradeComplete = () => {
    setSelectedStock(null);
    fetchPortfolioAndBalance();
  };

  const requestAccountDeletion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('account_deletion_requests')
      .insert([{ user_id: user.id }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit account deletion request. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account deletion request submitted. We'll process it within 30 days.",
      });
      setShowDeleteDialog(false);
    }
  };

  if (stocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No stocks available.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            This is a paper trading platform for educational purposes only. No real money or securities are involved.
            All trades are simulated and do not reflect real market transactions.
          </AlertDescription>
        </Alert>

        <AvailableCash balance={balance} />
        <PortfolioPositions stocks={stocks} />
        
        {selectedStock && (
          <TradeForm 
            selectedStock={selectedStock}
            onTrade={handleTradeComplete}
          />
        )}

        <StockList 
          stocks={stocks}
          onSelectStock={handleStockSelect}
        />

        <div className="mt-8 space-y-4 border-t pt-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-medium">Support</h3>
            <p className="text-sm text-muted-foreground">
              Need help? Contact us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                {supportEmail}
              </a>
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-medium">Account Management</h3>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your account? This action cannot be undone.
                All your data will be permanently removed within 30 days.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={requestAccountDeletion}>
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};