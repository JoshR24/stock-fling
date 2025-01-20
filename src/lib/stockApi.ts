import { supabase } from "@/integrations/supabase/client";

export interface StockData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  description: string;
  chartData: { time: string; value: number }[];
  news: {
    id: string;
    title: string;
    summary: string;
    date: string;
  }[];
}

const COMPANY_DESCRIPTIONS: Record<string, string> = {
  AAPL: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  MSFT: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
  GOOGL: "Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, and Asia Pacific.",
  AMZN: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions worldwide.",
  NVDA: "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.",
};

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];

export async function fetchStockData(symbol: string): Promise<StockData> {
  try {
    console.log('Fetching API key...');
    const { data: secretData, error: secretError } = await supabase
      .functions.invoke('get-secret', {
        body: { name: 'ALPHAVANTAGE_API_KEY' }
      });

    if (secretError) {
      console.error('Error fetching API key:', secretError);
      throw new Error('Failed to get API key');
    }

    if (!secretData?.ALPHAVANTAGE_API_KEY) {
      console.error('API key not found in response');
      throw new Error('API key not found');
    }

    console.log('Fetching stock data...');
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${secretData.ALPHAVANTAGE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data);

    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    const timeSeriesData = data['Time Series (Daily)'];
    if (!timeSeriesData) {
      throw new Error('No time series data found in response');
    }

    const dates = Object.keys(timeSeriesData).slice(0, 20).reverse();
    if (dates.length < 2) {
      throw new Error('Insufficient data points');
    }
    
    const chartData = dates.map(date => ({
      time: date,
      value: parseFloat(timeSeriesData[date]['4. close'])
    }));

    const latestPrice = parseFloat(timeSeriesData[dates[dates.length - 1]]['4. close']);
    const previousPrice = parseFloat(timeSeriesData[dates[dates.length - 2]]['4. close']);
    const change = ((latestPrice - previousPrice) / previousPrice) * 100;

    return {
      id: symbol,
      symbol,
      name: symbol,
      price: latestPrice,
      change: parseFloat(change.toFixed(2)),
      description: COMPANY_DESCRIPTIONS[symbol] || `${symbol} stock`,
      chartData,
      news: [
        {
          id: '1',
          title: 'Market Update',
          summary: `Latest ${symbol} stock price: $${latestPrice.toFixed(2)}`,
          date: new Date().toLocaleDateString()
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

export async function getRandomStock(): Promise<StockData> {
  const randomSymbol = STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)];
  return fetchStockData(randomSymbol);
}

export async function generateStockBatch(count: number): Promise<StockData[]> {
  const stocks = [];
  for (let i = 0; i < count; i++) {
    const stock = await getRandomStock();
    stocks.push(stock);
  }
  return stocks;
}