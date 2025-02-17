
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

    // Fetch active stocks from our database
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('symbol')
      .eq('status', 'active');

    if (stocksError) throw stocksError;

    // If no stocks found, add some initial ones
    if (!stocks || stocks.length === 0) {
      const initialStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];
      
      console.log('No stocks found, adding initial stocks:', initialStocks);

      for (const symbol of initialStocks) {
        await supabase
          .from('stocks')
          .insert({ symbol })
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
      
      stocks = newStocks;
    }

    console.log(`Updating cache for ${stocks.length} stocks`);

    // Update cache for each stock
    for (const stock of stocks) {
      try {
        // 1. Fetch latest stock data from Polygon
        const dailyResponse = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/${stock.symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
        );

        if (!dailyResponse.ok) {
          console.error(`Failed to fetch daily data for ${stock.symbol}:`, dailyResponse.statusText);
          continue;
        }

        const dailyData = await dailyResponse.json();
        
        if (!dailyData.results?.[0]) {
          console.error(`No daily data available for ${stock.symbol}`);
          continue;
        }

        // 2. Fetch historical data (1 year)
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 1); // Changed to fetch 1 year of data

        const historicalResponse = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/${stock.symbol}/range/1/day/${fromDate.toISOString().split('T')[0]}/${toDate.toISOString().split('T')[0]}?adjusted=true&limit=365&apiKey=${POLYGON_API_KEY}`
        );

        let chartData = [];
        if (historicalResponse.ok) {
          const historicalData = await historicalResponse.json();
          if (historicalData.results) {
            chartData = historicalData.results.map((item: any) => ({
              value: item.c,
              date: new Date(item.t).toISOString().split('T')[0]
            }));
          }
        }

        // 3. Fetch company details
        const detailsResponse = await fetch(
          `https://api.polygon.io/v3/reference/tickers/${stock.symbol}?apiKey=${POLYGON_API_KEY}`
        );

        let companyName = `${stock.symbol} Stock`;
        let description = `Trading data for ${stock.symbol}`;
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          if (detailsData.results) {
            companyName = detailsData.results.name || companyName;
            description = detailsData.results.description || description;
          }
        }

        // 4. Fetch news
        const newsResponse = await fetch(
          `https://api.polygon.io/v2/reference/news?ticker=${stock.symbol}&order=desc&limit=5&apiKey=${POLYGON_API_KEY}`
        );

        let news = [];
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          if (newsData.results) {
            news = newsData.results.map((item: any) => ({
              id: item.id,
              title: item.title,
              summary: item.description,
              date: new Date(item.published_utc).toLocaleDateString(),
              url: item.article_url
            }));
          }
        }

        const result = {
          symbol: stock.symbol,
          name: companyName,
          price: dailyData.results[0].c,
          change: dailyData.results[0].c && dailyData.results[0].o 
            ? ((dailyData.results[0].c - dailyData.results[0].o) / dailyData.results[0].o * 100)
            : 0,
          volume: dailyData.results[0].v,
          description,
          chartData,
          news,
          timestamp: dailyData.results[0].t
        };

        // Update stock_data_cache
        const { error: updateError } = await supabase
          .from('stock_data_cache')
          .upsert({
            symbol: stock.symbol,
            data: result
          })
          .select();

        if (updateError) {
          console.error(`Failed to update cache for ${stock.symbol}:`, updateError);
          continue;
        }

        console.log(`Successfully updated cache for ${stock.symbol}`);

      } catch (error) {
        console.error(`Error processing ${stock.symbol}:`, error);
        continue;
      }

      // Add a small delay between requests to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully updated cache for ${stocks.length} stocks` 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in updateStockCache:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to update stock cache'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
