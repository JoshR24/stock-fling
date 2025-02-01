import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  chartData: { value: number; date: string }[];
  description: string;
  error?: string;
  news: {
    id: string;
    title: string;
    summary: string;
    date: string;
    url: string;
  }[];
}

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Cache hit for ${key}`);
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ 
          error: 'Symbol is required',
          details: 'No symbol provided in request',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing request for symbol: ${symbol}`);

    const cachedData = getCachedData(symbol);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    await delay(1000);

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
      } else if (dailyData.hasOwnProperty('Error Message') || intradayData.hasOwnProperty('Error Message')) {
        console.error(`Alpha Vantage error for ${symbol}`);
        chartError = dailyData['Error Message'] || intradayData['Error Message'];
      } else {
        const dailyTimeSeriesData = dailyData['Time Series (Daily)'];
        const intradayTimeSeriesData = intradayData['Time Series (5min)'];
        
        if (dailyTimeSeriesData && intradayTimeSeriesData) {
          // Get last year of daily data
          const dailyPoints = Object.entries(dailyTimeSeriesData)
            .slice(0, 365)  // Get up to 365 days of data
            .map(([date, values]: [string, any]) => ({
              date: new Date(date).toLocaleDateString(),
              value: parseFloat(values['4. close'])
            }))
            .reverse();

          // Get today's intraday data
          const today = new Date().toISOString().split('T')[0];
          const intradayPoints = Object.entries(intradayTimeSeriesData)
            .filter(([timestamp]) => timestamp.startsWith(today))
            .map(([timestamp, values]: [string, any]) => ({
              date: new Date(timestamp).toLocaleTimeString(),
              value: parseFloat(values['4. close'])
            }))
            .reverse();

          // Combine both datasets
          chartPoints = [...intradayPoints, ...dailyPoints];
        } else {
          console.warn(`No time series data found for ${symbol}`);
          chartError = 'No historical data available';
        }
      }
    }

    const newsResponse = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${Deno.env.get('FINNHUB_API_KEY')}`
    );

    let newsData = [];
    if (newsResponse.ok) {
      newsData = await newsResponse.json();
    } else {
      console.warn(`Failed to fetch news for ${symbol}`);
    }

    const description = profileData.description 
      ? profileData.description.split('.')[0] + '.'
      : `${profileData.name || symbol} is a publicly traded company.`;

    const stockData: StockData = {
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

    setCachedData(symbol, stockData);

    console.log(`Successfully processed data for ${symbol}. Chart points: ${chartPoints.length}`);

    return new Response(JSON.stringify(stockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetchStockData:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch stock data',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});