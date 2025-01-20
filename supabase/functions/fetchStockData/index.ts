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
    url: string;
  }[];
}

// Fallback descriptions for common stocks
const fallbackDescriptions: Record<string, string> = {
  AAPL: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  GOOGL: "Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
  MSFT: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
  AMZN: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions worldwide.",
  META: "Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.",
  TSLA: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems worldwide.",
  NVDA: "NVIDIA Corporation provides graphics, and compute and networking solutions worldwide.",
  CSCO: "Cisco Systems, Inc. designs, manufactures, and sells Internet Protocol based networking and other communications technology.",
  // Add more fallbacks as needed...
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    const alphaVantageKey = Deno.env.get('ALPHAVANTAGE_API_KEY');
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');
    
    if (!alphaVantageKey || !finnhubKey) {
      console.error('API keys not found');
      throw new Error('API keys not configured');
    }

    console.log(`Fetching data for symbol: ${symbol}`);

    // Fetch quote from Alpha Vantage first since we need this data
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    const quoteData = await quoteResponse.json();
    console.log('Quote data received:', quoteData);

    // Process quote data with validation
    const quote = quoteData['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new Error(`Invalid quote data received for ${symbol}`);
    }

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

    // Only fetch company overview if we have valid quote data
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    const overviewData = await overviewResponse.json();
    console.log('Overview data received:', overviewData);

    // Fetch intraday data
    const intradayResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${alphaVantageKey}`
    );
    const intradayData = await intradayResponse.json();
    console.log('Intraday data received:', intradayData);

    // Process intraday data with validation
    let chartData = [];
    const timeSeriesData = intradayData['Time Series (5min)'];
    if (timeSeriesData && Object.keys(timeSeriesData).length > 0) {
      chartData = Object.entries(timeSeriesData)
        .map(([timestamp, values]: [string, any]) => ({
          value: parseFloat(values['4. close'])
        }))
        .filter(item => !isNaN(item.value))
        .reverse();
    }

    // If no valid chart data, throw error
    if (chartData.length === 0) {
      throw new Error(`No valid chart data received for ${symbol}`);
    }

    // Fetch news from Finnhub
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    const newsResponse = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}` +
      `&from=${pastDate.toISOString().split('T')[0]}` +
      `&to=${currentDate.toISOString().split('T')[0]}` +
      `&token=${finnhubKey}`
    );
    const newsData = await newsResponse.json();
    console.log('News data received:', newsData);

    // Process news with validation
    const news = (Array.isArray(newsData) ? newsData : [])
      .filter(item => item.url && item.headline && item.summary)
      .slice(0, 3)
      .map(item => ({
        id: item.id?.toString() || Math.random().toString(),
        title: item.headline,
        summary: item.summary,
        date: new Date(item.datetime * 1000).toLocaleDateString(),
        url: item.url
      }));

    // Get company description with fallback
    const description = overviewData?.Description || fallbackDescriptions[symbol] || 
      `${symbol} is a publicly traded company listed on major stock exchanges.`;

    const stockData: StockData = {
      symbol,
      name: overviewData?.Name || symbol,
      price,
      change,
      chartData,
      description,
      news
    };

    console.log('Processed stock data:', stockData);

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