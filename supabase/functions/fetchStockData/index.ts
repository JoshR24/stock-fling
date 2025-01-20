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

const companyDescriptions: Record<string, string> = {
  AAPL: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  GOOGL: "Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, and Asia Pacific.",
  MSFT: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
  // Add more company descriptions as needed
};

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

    // Generate realistic mock data
    const mockPrice = 100 + Math.random() * 900;
    const mockChange = (Math.random() * 10) - 5;
    
    // Generate chart data with a trend
    const trendDirection = Math.random() > 0.5 ? 1 : -1;
    const chartData = Array.from({ length: 20 }, (_, i) => {
      const trend = (i / 20) * trendDirection * (mockPrice * 0.1);
      return {
        value: mockPrice + trend + (Math.random() - 0.5) * (mockPrice * 0.02)
      };
    });

    // Get company description or use a generic one
    const description = companyDescriptions[symbol] || 
      `${symbol} is a publicly traded company operating in various sectors of the market.`;

    // Generate mock news with actual URLs
    const mockNews = [
      {
        id: '1',
        title: `Latest Market Analysis: ${symbol} Shows Strong Performance`,
        summary: `Recent market movements and expert analysis indicate positive trends for ${symbol}.`,
        date: new Date().toLocaleDateString(),
        url: `https://finance.yahoo.com/quote/${symbol}`
      },
      {
        id: '2',
        title: `${symbol} Announces Strategic Initiatives`,
        summary: `Industry experts weigh in on ${symbol}'s latest developments and market position.`,
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
        url: `https://finance.yahoo.com/quote/${symbol}/news`
      }
    ];

    const stockData: StockData = {
      symbol,
      name: `${symbol} Corporation`,
      price: parseFloat(mockPrice.toFixed(2)),
      change: parseFloat(mockChange.toFixed(2)),
      chartData,
      description,
      news: mockNews
    };

    console.log('Successfully generated mock data:', stockData);

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