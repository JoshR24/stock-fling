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

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

async function getStockDataFromCache(symbol: string) {
  const { data, error } = await supabase
    .from('stock_data_cache')
    .select('*')
    .eq('symbol', symbol)
    .single();

  if (error) {
    console.error('Cache fetch error:', error);
    return null;
  }

  if (data && Date.now() - new Date(data.last_updated).getTime() < CACHE_DURATION) {
    console.log(`Using cached data for ${symbol}`);
    return data.data;
  }

  return null;
}

async function updateStockDataCache(symbol: string, data: any) {
  const { error } = await supabase
    .from('stock_data_cache')
    .upsert({ 
      symbol, 
      data,
      last_updated: new Date().toISOString()
    });

  if (error) {
    console.error('Cache update error:', error);
  }
}

async function fetchPolygonData(symbol: string) {
  console.log(`Fetching fresh data from Polygon for ${symbol}`);
  
  const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
  if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key not configured');
  }

  // Fetch current price and daily change
  const quoteResponse = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
  );

  if (!quoteResponse.ok) {
    throw new Error(`Failed to fetch quote data for ${symbol}`);
  }

  const quoteData = await quoteResponse.json();

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
  const result = {
    symbol,
    name: detailsData.results.name || symbol,
    price: quoteData.results?.[0]?.c || 0,
    change: quoteData.results?.[0]?.c && quoteData.results?.[0]?.o 
      ? ((quoteData.results[0].c - quoteData.results[0].o) / quoteData.results[0].o * 100)
      : 0,
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

  return result;
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

    // Try to get cached data first
    const cachedData = await getStockDataFromCache(symbol);
    if (cachedData) {
      return new Response(
        JSON.stringify(cachedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no cached data, fetch fresh data from Polygon
    const freshData = await fetchPolygonData(symbol);
    
    // Update cache with new data
    await updateStockDataCache(symbol, freshData);

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