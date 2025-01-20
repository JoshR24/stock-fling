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
  GOOGL: "Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, and Asia Pacific.",
  AMZN: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions worldwide.",
  NVDA: "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.",
};

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];

async function getTimeSeriesFunction(timeRange: string) {
  switch (timeRange) {
    case '1D':
      return 'TIME_SERIES_INTRADAY&interval=5min';
    case '5D':
      return 'TIME_SERIES_INTRADAY&interval=60min';
    case '1M':
      return 'TIME_SERIES_DAILY';
    case 'YTD':
    case '1Y':
    case 'ALL':
      return 'TIME_SERIES_WEEKLY';
    default:
      return 'TIME_SERIES_DAILY';
  }
}

function getTimeSeriesKey(timeRange: string) {
  switch (timeRange) {
    case '1D':
      return 'Time Series (5min)';
    case '5D':
      return 'Time Series (60min)';
    case '1M':
      return 'Time Series (Daily)';
    case 'YTD':
    case '1Y':
    case 'ALL':
      return 'Weekly Time Series';
    default:
      return 'Time Series (Daily)';
  }
}

function filterDataByTimeRange(data: any[], timeRange: string) {
  const now = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '1D':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '5D':
      startDate.setDate(startDate.getDate() - 5);
      break;
    case '1M':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'YTD':
      startDate.setMonth(0, 1);
      break;
    case '1Y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'ALL':
      return data;
    default:
      startDate.setDate(startDate.getDate() - 1);
  }

  return data.filter(item => new Date(item.time) >= startDate && new Date(item.time) <= now);
}

export async function fetchStockData(symbol: string, timeRange: string = '1D'): Promise<StockData> {
  try {
    const { data: { ALPHAVANTAGE_API_KEY }, error: secretError } = await supabase
      .functions.invoke('get-secret', {
        body: { name: 'ALPHAVANTAGE_API_KEY' }
      });

    if (secretError) throw new Error('Failed to get API key');

    const timeSeriesFunction = await getTimeSeriesFunction(timeRange);
    const response = await fetch(
      `https://www.alphavantage.co/query?function=${timeSeriesFunction}&symbol=${symbol}&apikey=${ALPHAVANTAGE_API_KEY}`
    );
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    const timeSeriesData = data[getTimeSeriesKey(timeRange)];
    const dates = Object.keys(timeSeriesData).reverse();
    
    const chartData = dates.map(date => ({
      time: date,
      value: parseFloat(timeSeriesData[date]['4. close'])
    }));

    const filteredChartData = filterDataByTimeRange(chartData, timeRange);
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
      chartData: filteredChartData,
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