
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PortfolioActionsProps {
  onSuccess?: () => void;
}

export const usePortfolioActions = ({ onSuccess }: PortfolioActionsProps) => {
  const { toast } = useToast();

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
        .insert({
          user_id: user.id,
          symbol: symbol
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stock added to portfolio successfully.",
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error adding stock to portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio.",
        variant: "destructive",
      });
    }
  };

  return { handleAddToPortfolio };
};
