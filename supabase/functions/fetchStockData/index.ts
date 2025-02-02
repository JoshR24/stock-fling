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

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

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
    console.log(`Using cached data for ${symbol} (cache age: ${Math.round((Date.now() - new Date(data.last_updated).getTime()) / (1000 * 60 * 60))} hours)`);
    return data.data;
  }

  console.log(`Cache expired for ${symbol}, last updated: ${data?.last_updated}`);
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

async function fetchFreshStockData(symbol: string) {
  console.log(`Fetching fresh data for ${symbol}`);
  
  const [quoteResponse, profileResponse] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${Deno.env.get('FINNHUB_API_KEY')}`),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${Deno.env.get('FINNHUB_API_KEY')}`)
  ]);

  if (!quoteResponse.ok || !profileResponse.ok) {
    throw new Error(`Failed to fetch data for ${symbol}`);
  }

  const [quoteData, profileData] = await Promise.all([
    quoteResponse.json(),
    profileResponse.json()
  ]);

  // Get both daily and intraday data
  const [dailyResponse, intradayResponse] = await Promise.all([
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${Deno.env.get('ALPHAVANTAGE_API_KEY')}`),
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${Deno.env.get('ALPHAVANTAGE_API_KEY')}`)
  ]);

  let chartPoints = [];
  let chartError = null;

  if (!dailyResponse.ok || !intradayResponse.ok) {
    console.error(`Failed to fetch chart data for ${symbol}`);
    chartError = 'Failed to fetch chart data';
  } else {
    const [dailyData, intradayData] = await Promise.all([
      dailyResponse.json(),
      intradayResponse.json()
    ]);
    
    if (dailyData.hasOwnProperty('Note') || intradayData.hasOwnProperty('Note')) {
      console.warn(`Alpha Vantage rate limit hit for ${symbol}`);
      chartError = 'API rate limit exceeded. Please try again in a minute.';
    } else {
      const dailyTimeSeriesData = dailyData['Time Series (Daily)'];
      const intradayTimeSeriesData = intradayData['Time Series (5min)'];
      
      if (dailyTimeSeriesData && intradayTimeSeriesData) {
        const dailyPoints = Object.entries(dailyTimeSeriesData)
          .slice(0, 365)
          .map(([date, values]: [string, any]) => ({
            date: new Date(date).toLocaleDateString(),
            value: parseFloat(values['4. close'])
          }))
          .reverse();

        const today = new Date().toISOString().split('T')[0];
        const intradayPoints = Object.entries(intradayTimeSeriesData)
          .filter(([timestamp]) => timestamp.startsWith(today))
          .map(([timestamp, values]: [string, any]) => ({
            date: new Date(timestamp).toLocaleTimeString(),
            value: parseFloat(values['4. close'])
          }))
          .reverse();

        chartPoints = [...intradayPoints, ...dailyPoints];
      }
    }
  }

  const newsResponse = await fetch(
    `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${Deno.env.get('FINNHUB_API_KEY')}`
  );

  let newsData = [];
  if (newsResponse.ok) {
    newsData = await newsResponse.json();
  }

  const description = profileData.description 
    ? profileData.description.split('.')[0] + '.'
    : `${profileData.name || symbol} is a publicly traded company.`;

  return {
    symbol,
    name: profileData.name || symbol,
    price: quoteData.c || 0,
    change: quoteData.pc ? ((quoteData.c - quoteData.pc) / quoteData.pc * 100) : 0,
    chartData: chartPoints,
    description: description,
    ...(chartError && { error: chartError }),
    news: newsData
      .slice(0, 5)
      .map((article: any, index: number) => ({
        id: `${symbol}-news-${index + 1}`,
        title: article.headline || 'No title available',
        summary: article.summary || 'No summary available',
        date: new Date(article.datetime * 1000).toLocaleDateString(),
        url: article.url || ''
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

    // Try to get cached data first
    const cachedData = await getStockDataFromCache(symbol);
    if (cachedData) {
      return new Response(
        JSON.stringify(cachedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no cached data, fetch fresh data
    const freshData = await fetchFreshStockData(symbol);
    
    // Update cache with new data
    await updateStockDataCache(symbol, freshData);

    return new Response(
      JSON.stringify(freshData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetchStockData:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch stock data' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});