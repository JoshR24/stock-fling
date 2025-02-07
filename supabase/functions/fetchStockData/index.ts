
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function fetchPolygonPrice(symbol: string) {
  const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
  if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key not configured');
  }

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Fetching real-time price for ${symbol}`);
  
  const quoteResponse = await fetch(
    `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${POLYGON_API_KEY}`
  );

  if (!quoteResponse.ok) {
    console.error(`[${timestamp}] Failed to fetch quote data for ${symbol}: ${quoteResponse.status}`);
    throw new Error(`Failed to fetch quote data for ${symbol}`);
  }

  const quoteData = await quoteResponse.json();
  console.log(`[${timestamp}] Raw response for ${symbol}:`, JSON.stringify(quoteData));
  
  if (!quoteData.results?.p) {
    console.warn(`[${timestamp}] No price data found for ${symbol} in response:`, JSON.stringify(quoteData));
  }
  
  const price = quoteData.results?.p || 0;
  console.log(`[${timestamp}] Extracted price for ${symbol}: ${price}`);
  
  return {
    price: price,
    change: 0 // We'll need to calculate this differently with real-time data
  };
}

async function fetchPolygonData(symbol: string) {
  console.log(`[${new Date().toISOString()}] Fetching complete data from Polygon for ${symbol}`);
  
  const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
  if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key not configured');
  }

  // Always fetch fresh price data
  const priceData = await fetchPolygonPrice(symbol);

  // Fetch company details
  const detailsResponse = await fetch(
    `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
  );

  if (!detailsResponse.ok) {
    throw new Error(`Failed to fetch details for ${symbol}`);
  }

  const detailsData = await detailsResponse.json();

  // Fetch historical data (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
  const formattedFromDate = thirtyDaysAgo.toISOString().split('T')[0];
  const formattedToDate = new Date().toISOString().split('T')[0];

  const historicalResponse = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${formattedFromDate}/${formattedToDate}?adjusted=true&sort=asc&limit=120&apiKey=${POLYGON_API_KEY}`
  );

  if (!historicalResponse.ok) {
    throw new Error(`Failed to fetch historical data for ${symbol}`);
  }

  const historicalData = await historicalResponse.json();

  // Fetch news
  const newsResponse = await fetch(
    `https://api.polygon.io/v2/reference/news?ticker=${symbol}&order=desc&limit=5&apiKey=${POLYGON_API_KEY}`
  );

  let newsData = [];
  if (newsResponse.ok) {
    const newsJson = await newsResponse.json();
    newsData = newsJson.results || [];
  }

  // Format the data
  return {
    symbol,
    name: detailsData.results.name || symbol,
    price: priceData.price,
    change: priceData.change,
    chartData: (historicalData.results || []).map((bar: any) => ({
      date: new Date(bar.t).toLocaleDateString(),
      value: bar.c
    })),
    description: detailsData.results.description || `${detailsData.results.name || symbol} is a publicly traded company.`,
    news: newsData.map((article: any, index: number) => ({
      id: `${symbol}-news-${index + 1}`,
      title: article.title || 'No title available',
      summary: article.description || 'No summary available',
      date: new Date(article.published_utc).toLocaleDateString(),
      url: article.article_url || ''
    }))
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing request for symbol: ${symbol}`);

    // Always fetch fresh data from Polygon
    const freshData = await fetchPolygonData(symbol);

    return new Response(
      JSON.stringify(freshData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetchStockData:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch stock data',
        details: error.toString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
