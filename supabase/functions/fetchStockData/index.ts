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

// Extended fallback descriptions for common stocks
const fallbackDescriptions: Record<string, string> = {
  AAPL: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  GOOGL: "Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
  MSFT: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
  AMZN: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions worldwide.",
  META: "Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.",
  TSLA: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems worldwide.",
  NVDA: "NVIDIA Corporation provides graphics, and compute and networking solutions worldwide.",
  AMD: "Advanced Micro Devices, Inc. designs and produces microprocessors and graphics processors for personal computers and gaming consoles.",
  INTC: "Intel Corporation designs and manufactures computing and communication components, such as microprocessors, chipsets, motherboards, and wireless and wired connectivity products.",
  TSM: "Taiwan Semiconductor Manufacturing Company Limited manufactures and sells integrated circuits and semiconductors worldwide.",
  CSCO: "Cisco Systems, Inc. designs, manufactures, and sells Internet Protocol based networking and other communications technology.",
  ORCL: "Oracle Corporation provides products and services that address enterprise information technology environments worldwide.",
  SHOP: "Shopify Inc. provides a commerce platform and services in Canada, the United States, Europe, the Middle East, Africa, the Asia Pacific, and Latin America.",
  PYPL: "PayPal Holdings, Inc. operates a technology platform that enables digital payments on behalf of merchants and consumers worldwide.",
  SQ: "Block, Inc. (formerly Square) provides payment and point-of-sale solutions to merchants and related services.",
  ABNB: "Airbnb, Inc. operates a platform for stays and experiences to guests worldwide.",
  F: "Ford Motor Company designs, manufactures, markets, and services a range of Ford trucks, cars, sport utility vehicles, electrified vehicles, and Lincoln luxury vehicles worldwide.",
  GM: "General Motors Company designs, manufactures, and sells cars, trucks, crossovers, and automobile parts worldwide.",
  TM: "Toyota Motor Corporation designs, manufactures, assembles, and sells passenger vehicles, minivans and commercial vehicles, and related parts and accessories worldwide.",
  RIVN: "Rivian Automotive, Inc. designs, develops, manufactures, and sells electric vehicles and accessories worldwide.",
  NIO: "NIO Inc. designs, develops, manufactures, and sells smart electric vehicles in China, Europe, and North America.",
  JPM: "JPMorgan Chase & Co. operates as a financial services company worldwide, providing investment banking, financial services for consumers, small businesses, and institutions.",
  BAC: "Bank of America Corporation provides banking and financial products and services for individual consumers, businesses, and institutions worldwide.",
  V: "Visa Inc. operates as a payments technology company worldwide, facilitating digital payments among consumers, merchants, financial institutions, and government entities.",
  JNJ: "Johnson & Johnson researches, develops, manufactures, and sells various products in the healthcare field worldwide.",
  PFE: "Pfizer Inc. discovers, develops, manufactures, markets, distributes, and sells biopharmaceutical products worldwide.",
  WMT: "Walmart Inc. operates retail, wholesale, and other units worldwide, offering various products through physical stores and ecommerce.",
  COST: "Costco Wholesale Corporation operates membership warehouses worldwide, offering branded and private-label products across a wide range of categories.",
  HD: "The Home Depot, Inc. operates home improvement retail stores, selling various building materials, home improvement products, lawn and garden products, and décor products.",
  NFLX: "Netflix, Inc. provides entertainment services worldwide, offering streaming content including television series, documentaries, feature films, and mobile games.",
  DIS: "The Walt Disney Company operates as an entertainment company worldwide, offering streaming services, theme parks, and media networks.",
  VZ: "Verizon Communications Inc. offers communications, technology, information, and entertainment products and services worldwide.",
  XOM: "Exxon Mobil Corporation explores for and produces crude oil and natural gas worldwide.",
  CVX: "Chevron Corporation engages in integrated energy and chemicals operations worldwide.",
  KO: "The Coca-Cola Company manufactures, markets, and sells various nonalcoholic beverages worldwide.",
  PEP: "PepsiCo, Inc. manufactures, markets, distributes, and sells various beverages and convenient foods worldwide.",
  SBUX: "Starbucks Corporation operates as a roaster, marketer, and retailer of specialty coffee worldwide.",
  NKE: "NIKE, Inc. designs, develops, markets, and sells athletic footwear, apparel, equipment, and accessories worldwide."
};

serve(async (req) => {
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

    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch quote with retry logic
    let quoteData;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const quoteResponse = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
        );
        
        if (!quoteResponse.ok) {
          throw new Error(`Quote API responded with status: ${quoteResponse.status}`);
        }

        quoteData = await quoteResponse.json();
        
        // Check if we got valid data
        if (quoteData && quoteData['Global Quote'] && quoteData['Global Quote']['05. price']) {
          break;
        }

        console.log(`Retry ${retryCount + 1}: Invalid quote data received for ${symbol}`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!quoteData || !quoteData['Global Quote'] || !quoteData['Global Quote']['05. price']) {
      console.error(`Failed to get valid quote data for ${symbol} after ${maxRetries} attempts`);
      throw new Error(`Could not fetch valid quote data for ${symbol}`);
    }

    const quote = quoteData['Global Quote'];
    const price = parseFloat(quote['05. price']) || 100; // Fallback to 100 if parsing fails
    const change = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

    // Generate dummy chart data based on current price
    const chartData = Array.from({ length: 20 }, (_, i) => ({
      value: price + (Math.random() - 0.5) * (price * 0.02) // 2% variation
    }));

    // Use fallback description if available, otherwise use generic description
    const description = fallbackDescriptions[symbol] || 
      `${symbol} is a publicly traded company listed on major stock exchanges.`;

    // Get company name with fallback
    const name = fallbackDescriptions[symbol]?.split('.')[0] || symbol;

    // Fetch news with retry logic
    let newsData = [];
    retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const currentDate = new Date();
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);

        const newsResponse = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${symbol}` +
          `&from=${pastDate.toISOString().split('T')[0]}` +
          `&to=${currentDate.toISOString().split('T')[0]}` +
          `&token=${finnhubKey}`
        );

        if (!newsResponse.ok) {
          throw new Error(`News API responded with status: ${newsResponse.status}`);
        }

        const rawNewsData = await newsResponse.json();
        
        if (Array.isArray(rawNewsData) && rawNewsData.length > 0) {
          newsData = rawNewsData
            .filter(item => item.url && item.headline && item.summary)
            .slice(0, 3)
            .map(item => ({
              id: item.id?.toString() || Math.random().toString(),
              title: item.headline,
              summary: item.summary,
              date: new Date(item.datetime * 1000).toLocaleDateString(),
              url: item.url
            }));
          break;
        }

        console.log(`Retry ${retryCount + 1}: Invalid news data received for ${symbol}`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`News fetch attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount === maxRetries) {
          // Don't throw error for news, just use empty array
          console.log(`Using empty news array for ${symbol} after ${maxRetries} failed attempts`);
          newsData = [];
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const stockData: StockData = {
      symbol,
      name,
      price,
      change,
      chartData,
      description,
      news: newsData
    };

    console.log('Successfully processed stock data:', stockData);

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