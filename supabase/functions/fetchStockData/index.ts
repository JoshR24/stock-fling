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

// Fallback descriptions for common stocks
const fallbackDescriptions: Record<string, string> = {
  AAPL: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  GOOGL: "Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
  MSFT: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
  AMZN: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions worldwide.",
  META: "Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.",
  TSLA: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems worldwide.",
  NVDA: "NVIDIA Corporation provides graphics, and compute and networking solutions worldwide.",
  // Add more fallbacks as needed...
};

// Function to get company description with fallback
const getCompanyDescription = (symbol: string, overviewData: any): string => {
  // First try to get from API response
  if (overviewData?.Description) {
    return overviewData.Description;
  }
  
  // Then try fallback descriptions
  if (fallbackDescriptions[symbol]) {
    console.log(`Using fallback description for ${symbol}`);
    return fallbackDescriptions[symbol];
  }
  
  // Generic fallback based on sector/industry if available
  if (overviewData?.Sector || overviewData?.Industry) {
    const sector = overviewData.Sector || 'various sectors';
    const industry = overviewData.Industry || 'various industries';
    return `${symbol} operates in ${sector}, specifically in ${industry}. The company provides products and services to its customers worldwide.`;
  }
  
  // Final generic fallback
  return `${symbol} is a publicly traded company listed on major stock exchanges. The company operates in various business segments and serves customers globally.`;
};

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
        value: 100 + Math.random() * 10
      }));
    }

    // Process quote data with fallback values
    const quote = quoteData['Global Quote'] || {};
    const price = parseFloat(quote['05. price']) || 0;
    const change = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

    // Get company description with enhanced fallback
    const description = getCompanyDescription(symbol, overviewData);

    // Process news data with fallback
    const news = (newsData.feed || [])
      .slice(0, 3)
      .map((item: any, index: number) => ({
        id: index.toString(),
        title: item.title || `Latest Update on ${symbol}`,
        summary: item.summary || `Stay tuned for the latest updates and news about ${symbol}.`,
        date: item.time_published ? 
          new Date(item.time_published).toLocaleDateString() : 
          new Date().toLocaleDateString()
      }));

    // If no news available, provide relevant dummy news
    if (news.length === 0) {
      news.push({
        id: '1',
        title: `Market Update: ${symbol} Stock Analysis`,
        summary: `Stay informed about ${symbol}'s market performance and latest developments. Our analysis provides insights into the company's current position and future prospects.`,
        date: new Date().toLocaleDateString()
      });
    }

    const stockData: StockData = {
      symbol,
      name: overviewData.Name || symbol,
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