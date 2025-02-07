
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useStockCache = () => {
  const { toast } = useToast();

  useEffect(() => {
    const initializeStockCache = async () => {
      try {
        const { data: updateData, error: updateError } = await supabase.functions.invoke('updateStockCache');
        if (updateError) throw updateError;
        
        console.log('Cache initialization response:', updateData);
        
        const { data: fetchData, error: fetchError } = await supabase.functions.invoke('fetchStockData', {
          body: { symbol: 'AAPL' }
        });
        
        if (fetchError) throw fetchError;
        
        console.log('Test fetch response:', fetchData);
        
      } catch (error) {
        console.error('Error initializing cache:', error);
        toast({
          title: "Cache Initialization Error",
          description: "Failed to initialize stock cache. Please try again later.",
          variant: "destructive",
        });
      }
    };

    initializeStockCache();
  }, [toast]);
};
