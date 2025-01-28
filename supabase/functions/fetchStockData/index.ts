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
  error?: string;
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

    // Get real-time quote and company profile from Finnhub
    const [quoteResponse, profileResponse] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${Deno.env.get('FINNHUB_API_KEY')}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${Deno.env.get('FINNHUB_API_KEY')}`)
    ]);

    if (!quoteResponse.ok || !profileResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch data for ${symbol}`,
          details: `Quote response: ${quoteResponse.status}, Profile response: ${profileResponse.status}`,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const [quoteData, profileData] = await Promise.all([
      quoteResponse.json(),
      profileResponse.json()
    ]);

    // Get 1 month of daily historical data from Alpha Vantage
    const chartResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${Deno.env.get('ALPHAVANTAGE_API_KEY')}`
    );

    let chartPoints = [];
    let chartError = null;

    if (!chartResponse.ok) {
      console.error(`Failed to fetch chart data for ${symbol}: ${chartResponse.statusText}`);
      chartError = 'Failed to fetch chart data';
    } else {
      const chartData = await chartResponse.json();
      
      if (chartData.hasOwnProperty('Note')) {
        console.warn(`Alpha Vantage rate limit hit for ${symbol}: ${chartData.Note}`);
        chartError = 'API rate limit exceeded. Please try again in a minute.';
      } else if (chartData.hasOwnProperty('Error Message')) {
        console.error(`Alpha Vantage error for ${symbol}: ${chartData['Error Message']}`);
        chartError = chartData['Error Message'];
      } else {
        const timeSeriesData = chartData['Time Series (Daily)'];
        
        if (timeSeriesData) {
          chartPoints = Object.entries(timeSeriesData)
            .slice(0, 30)
            .map(([date, values]: [string, any]) => ({
              date: new Date(date).toLocaleDateString(),
              value: parseFloat(values['4. close'])
            }))
            .reverse();
        } else {
          console.warn(`No time series data found for ${symbol}`);
          chartError = 'No historical data available';
        }
      }
    }

    // Get company news
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    const newsResponse = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${pastDate.toISOString().split('T')[0]}&to=${currentDate.toISOString().split('T')[0]}&token=${Deno.env.get('FINNHUB_API_KEY')}`
    );

    let newsData = [];
    if (newsResponse.ok) {
      newsData = await newsResponse.json();
    } else {
      console.warn(`Failed to fetch news for ${symbol}`);
    }

    // Create a focused description about what the company does
    const description = profileData.description 
      ? profileData.description.split('.')[0] + '.' // Take just the first sentence
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

    console.log(`Processed data for ${symbol}. Chart points: ${chartPoints.length}`);

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