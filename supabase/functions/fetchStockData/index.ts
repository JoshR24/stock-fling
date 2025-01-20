import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
      console.error('AlphaVantage API key not found');
      throw new Error('API key not configured');
    }

    console.log(`Fetching data for symbol: ${symbol}`);

    // Fetch company overview
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    );
    const overviewData = await overviewResponse.json();
    console.log('Overview data received:', overviewData);

    // Check if overview data is empty or has an error
    if (!overviewData || Object.keys(overviewData).length === 0 || overviewData.Note || overviewData['Error Message']) {
      throw new Error(`No data available for symbol: ${symbol}`);
    }

    // Fetch intraday data
    const intradayResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`
    );
    const intradayData = await intradayResponse.json();
    console.log('Intraday data received:', intradayData);

    // Fetch global quote
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    const quoteData = await quoteResponse.json();
    console.log('Quote data received:', quoteData);

    // Fetch news sentiment
    const newsResponse = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&symbol=${symbol}&apikey=${apiKey}`
    );
    const newsData = await newsResponse.json();
    console.log('News data received:', newsData);

    // Process intraday data with fallback
    let chartData = [];
    const timeSeriesData = intradayData['Time Series (5min)'];
    if (timeSeriesData && Object.keys(timeSeriesData).length > 0) {
      chartData = Object.entries(timeSeriesData)
        .map(([timestamp, values]: [string, any]) => ({
          value: parseFloat(values['4. close']) || 0
        }))
        .reverse();
    } else {
      // Fallback: Create dummy chart data
      chartData = Array(20).fill(0).map((_, i) => ({
        value: overviewData.MarketCapitalization ? 
          parseFloat(overviewData.MarketCapitalization) / 1000000 : 
          100 + Math.random() * 10
      }));
    }

    // Process quote data with fallback values
    const quote = quoteData['Global Quote'] || {};
    const price = parseFloat(quote['05. price']) || parseFloat(overviewData.MarketCapitalization) / 1000000 || 0;
    const change = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

    // Process news data with fallback
    const news = (newsData.feed || [])
      .slice(0, 3)
      .map((item: any, index: number) => ({
        id: index.toString(),
        title: item.title || `News ${index + 1}`,
        summary: item.summary || 'No summary available',
        date: item.time_published ? 
          new Date(item.time_published).toLocaleDateString() : 
          new Date().toLocaleDateString()
      }));

    // If no news available, provide dummy news
    if (news.length === 0) {
      news.push({
        id: '1',
        title: 'No recent news available',
        summary: 'Check back later for updates on this stock.',
        date: new Date().toLocaleDateString()
      });
    }

    const stockData: StockData = {
      symbol,
      name: overviewData.Name || symbol,
      price,
      change,
      chartData,
      description: overviewData.Description || `No description available for ${symbol}`,
      news
    };

    console.log('Processed stock data:', stockData);

    return new Response(JSON.stringify(stockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetchStockData:', error);
    
    // Return a more informative error response
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