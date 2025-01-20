import { serve } from 'https://deno.fresh.run/std@v9.6.1/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    const apiKey = Deno.env.get('ALPHAVANTAGE_API_KEY');
    
    if (!apiKey) {
      throw new Error('AlphaVantage API key not found');
    }

    // Fetch company overview
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    );
    const overviewData = await overviewResponse.json();

    // Fetch intraday data
    const intradayResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`
    );
    const intradayData = await intradayResponse.json();

    // Fetch global quote for current price and change
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    const quoteData = await quoteResponse.json();

    // Fetch news sentiment
    const newsResponse = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&symbol=${symbol}&apikey=${apiKey}`
    );
    const newsData = await newsResponse.json();

    // Process intraday data
    const timeSeriesData = intradayData['Time Series (5min)'] || {};
    const chartData = Object.entries(timeSeriesData).map(([timestamp, values]: [string, any]) => ({
      value: parseFloat(values['4. close'])
    })).reverse();

    // Process quote data
    const quote = quoteData['Global Quote'] || {};
    const price = parseFloat(quote['05. price']) || 0;
    const change = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

    // Process news data
    const news = (newsData.feed || []).slice(0, 3).map((item: any, index: number) => ({
      id: index.toString(),
      title: item.title,
      summary: item.summary,
      date: new Date(item.time_published).toLocaleDateString()
    }));

    const stockData: StockData = {
      symbol,
      name: overviewData.Name || symbol,
      price,
      change,
      chartData,
      description: overviewData.Description || 'No description available',
      news
    };

    return new Response(JSON.stringify(stockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stock data' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});