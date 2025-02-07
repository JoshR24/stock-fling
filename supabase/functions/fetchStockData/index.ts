
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
    if (!POLYGON_API_KEY) {
      throw new Error('Polygon API key not configured');
    }

    // Fetch real-time trade data from Polygon
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }

    const data = await response.json();
    
    if (!data.results?.[0]) {
      throw new Error(`No data available for ${symbol}`);
    }

    const result = {
      symbol,
      price: data.results[0].c,
      change: data.results[0].c && data.results[0].o 
        ? ((data.results[0].c - data.results[0].o) / data.results[0].o * 100)
        : 0
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetchStockData:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch stock data',
        details: error.toString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
