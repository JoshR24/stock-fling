import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Adjusted rate limiting to be more lenient
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Increased from 3 to 10 requests per minute
const requestLog: { timestamp: number }[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  // Remove requests older than the window
  const windowStart = now - RATE_LIMIT_WINDOW;
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  
  // Update the request log
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  // Check if we're over the limit
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    console.log(`Rate limit exceeded. Current requests in window: ${recentRequests.length}`);
    return true;
  }
  
  // Add the current request
  requestLog.push({ timestamp: now });
  return false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request for AI recommendations');
    
    // Check rate limiting
    if (isRateLimited()) {
      console.log('Request rate limited');
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please wait a minute before trying again." 
        }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key is not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing prompt:', prompt);

    if (!prompt) {
      throw new Error('No prompt provided');
    }

    const systemPrompt = `You are a financial advisor AI that recommends stocks based on investment ideas or market sentiments. 
    For the given market sentiment or investment thesis, recommend exactly 3 relevant publicly traded stocks.
    Format your response as a JSON array of objects, where each object has:
    - symbol: The stock ticker symbol
    - name: The company name
    - reason: A brief explanation of why this stock fits the investment thesis
    
    Only return the JSON array, no other text.`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "OpenAI API is busy. Please try again in a few moments." 
          }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully received OpenAI response');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const recommendations = JSON.parse(data.choices[0].message.content);
    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in getAIStockRecommendations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});