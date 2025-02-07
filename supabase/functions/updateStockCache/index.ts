
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting stock cache update process');

    const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
    if (!POLYGON_API_KEY) {
      throw new Error('Polygon API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active stocks from database
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('symbol')
      .eq('status', 'active');

    if (stocksError) throw stocksError;

    // If no stocks found, add initial ones
    if (!stocks || stocks.length === 0) {
      const initialStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];
      
      console.log('No stocks found, adding initial stocks:', initialStocks);

      for (const symbol of initialStocks) {
        await supabase
          .from('stocks')
          .insert({ symbol, status: 'active' })
          .select()
          .maybeSingle();
      }

      // Fetch the newly inserted stocks
      const { data: newStocks, error: newStocksError } = await supabase
        .from('stocks')
        .select('symbol')
        .eq('status', 'active');

      if (newStocksError) throw newStocksError;
      if (!newStocks) throw new Error('Failed to fetch new stocks');
      
      console.log('Successfully added initial stocks');
    }

    // Update cache for each stock
    const activeStocks = stocks || [];
    console.log(`Updating cache for ${activeStocks.length} stocks`);

    for (const stock of activeStocks) {
      try {
        // Fetch stock data from Polygon
        const response = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/${stock.symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
        );

        if (!response.ok) {
          console.error(`Failed to fetch data for ${stock.symbol}:`, response.statusText);
          continue;
        }

        const polygonData = await response.json();
        
        if (!polygonData.results?.[0]) {
          console.error(`No data available for ${stock.symbol}`);
          continue;
        }

        const stockData = {
          symbol: stock.symbol,
          data: {
            price: polygonData.results[0].c,
            change: ((polygonData.results[0].c - polygonData.results[0].o) / polygonData.results[0].o * 100),
            name: `${stock.symbol} Inc.`,
            description: `Description for ${stock.symbol}`,
            chartData: [],
            news: []
          }
        };

        // Update stock_data_cache
        const { error: updateError } = await supabase
          .from('stock_data_cache')
          .upsert(stockData);

        if (updateError) {
          console.error(`Failed to update cache for ${stock.symbol}:`, updateError);
          continue;
        }

        console.log(`Successfully updated cache for ${stock.symbol}`);

      } catch (error) {
        console.error(`Error processing ${stock.symbol}:`, error);
        continue;
      }

      // Add a small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in updateStockCache:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to update stock cache',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
