import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  chartData: { value: number }[];
  description: string;
  news: {
    id: string;
    title: string;
    summary: string;
    date: string;
    url: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Processing request for symbol: ${symbol}`);

    // Fetch real-time quote data from Finnhub
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${Deno.env.get('FINNHUB_API_KEY')}`
    );
    
    if (!quoteResponse.ok) {
      throw new Error(`Failed to fetch quote data for ${symbol}`);
    }

    const quoteData = await quoteResponse.json();
    console.log('Quote data:', quoteData);

    if (!quoteData.c) {
      throw new Error(`Invalid quote data received for ${symbol}`);
    }

    // Fetch company profile from Finnhub
    const profileResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${Deno.env.get('FINNHUB_API_KEY')}`
    );
    
    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profile data for ${symbol}`);
    }

    const profileData = await profileResponse.json();
    console.log('Profile data:', profileData);

    // Fetch historical data from Alpha Vantage for the chart
    const chartResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${Deno.env.get('ALPHAVANTAGE_API_KEY')}`
    );

    if (!chartResponse.ok) {
      throw new Error(`Failed to fetch chart data for ${symbol}`);
    }

    const chartData = await chartResponse.json();
    console.log('Chart data received');

    // Process chart data
    const timeSeriesData = chartData['Time Series (5min)'];
    const chartPoints = timeSeriesData ? 
      Object.entries(timeSeriesData)
        .slice(0, 20)
        .map(([_, values]: [string, any]) => ({
          value: parseFloat(values['4. close'])
        }))
        .reverse() : [];

    // Fetch company news from Finnhub
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    const newsResponse = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${pastDate.toISOString().split('T')[0]}&to=${currentDate.toISOString().split('T')[0]}&token=${Deno.env.get('FINNHUB_API_KEY')}`
    );

    if (!newsResponse.ok) {
      throw new Error(`Failed to fetch news data for ${symbol}`);
    }

    const newsData = await newsResponse.json();
    console.log('News data received');

    // Process and format the data
    const stockData: StockData = {
      symbol,
      name: profileData.name || `${symbol} Stock`,
      price: quoteData.c,
      change: ((quoteData.c - quoteData.pc) / quoteData.pc * 100),
      chartData: chartPoints,
      description: profileData.description || `${symbol} is a publicly traded company.`,
      news: newsData
        .slice(0, 5)
        .map((article: any, index: number) => ({
          id: `${index + 1}`,
          title: article.headline,
          summary: article.summary,
          date: new Date(article.datetime * 1000).toLocaleDateString(),
          url: article.url
        }))
    };

    console.log('Successfully processed data for:', symbol);

    return new Response(JSON.stringify(stockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch stock data',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});