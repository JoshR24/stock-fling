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
  chartData: { value: number; date: string }[];
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Processing request for symbol: ${symbol}`);

    // Get real-time quote and company profile from Finnhub
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

    // Get 1 month of daily historical data from Alpha Vantage
    const chartResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${Deno.env.get('ALPHAVANTAGE_API_KEY')}`
    );

    if (!chartResponse.ok) {
      throw new Error(`Failed to fetch chart data for ${symbol}`);
    }

    const chartData = await chartResponse.json();
    console.log('Received chart data from Alpha Vantage:', JSON.stringify(chartData).slice(0, 200));

    // Process historical data - last 30 days
    const timeSeriesData = chartData['Time Series (Daily)'];
    let chartPoints = [];
    
    if (timeSeriesData) {
      chartPoints = Object.entries(timeSeriesData)
        .slice(0, 30)
        .map(([date, values]: [string, any]) => ({
          date: new Date(date).toLocaleDateString(),
          value: parseFloat(values['4. close'])
        }))
        .reverse();
    } else {
      console.error('No time series data found in Alpha Vantage response');
    }

    // Get company news
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
    console.log('Received news data from Finnhub');

    // Format the response
    const stockData: StockData = {
      symbol,
      name: profileData.name || symbol,
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

    console.log(`Successfully processed data for ${symbol}. Chart points: ${chartPoints.length}`);

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