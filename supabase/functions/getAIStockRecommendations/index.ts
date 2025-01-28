import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request for AI recommendations');
    
    const { prompt } = await req.json();
    console.log('Processing prompt:', prompt);

    if (!prompt) {
      throw new Error('No prompt provided');
    }

    const systemPrompt = `You are a financial advisor AI. Your task is to recommend exactly 10 relevant publicly traded stocks based on the given market sentiment or investment thesis.
    IMPORTANT: Respond ONLY with a JSON array. Do not include any markdown formatting, explanation text, or code blocks.
    Each object in the array must have exactly these fields:
    - symbol: stock ticker symbol (string)
    - name: company name (string)
    - reason: brief explanation (string)
    Example response format:
    [{"symbol":"AAPL","name":"Apple Inc.","reason":"Strong market position in consumer electronics"}]`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received OpenAI response');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    let recommendations;
    try {
      recommendations = JSON.parse(data.choices[0].message.content);
      console.log('Successfully parsed recommendations:', recommendations);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Failed to parse AI recommendations');
    }

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