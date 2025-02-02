import { supabase } from "@/integrations/supabase/client";

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  chartData: { value: number; date?: string }[];
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

// Extended list of popular stocks across different sectors
const stockUniverse = [
  // Technology
  'AAPL', 'GOOGL', 'MSFT', 'META', 'NVDA', 'AMD', 'INTC', 'TSM', 'CSCO', 'ORCL', 'IBM', 'ADBE', 'CRM', 'QCOM', 'TXN',
  // E-commerce & Internet
  'AMZN', 'BABA', 'SHOP', 'ETSY', 'EBAY', 'PYPL', 'SQ', 'ABNB', 'MELI', 'CHWY', 'W', 'PINS', 'SNAP', 'TWLO',
  // Electric Vehicles & Auto
  'TSLA', 'F', 'GM', 'TM', 'RIVN', 'NIO', 'LCID', 'LI', 'XPEV', 'FSR', 'NKLA', 'HMC',
  // Financial Services
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'AXP', 'C', 'BLK', 'SCHW', 'USB', 'PNC', 'COF',
  // Healthcare
  'JNJ', 'PFE', 'MRNA', 'ABBV', 'UNH', 'CVS', 'WBA', 'LLY', 'TMO', 'DHR', 'BMY', 'AMGN', 'GILD', 'REGN',
  // Retail
  'WMT', 'TGT', 'COST', 'HD', 'LOW', 'DG', 'DLTR', 'KR', 'ULTA', 'BBY', 'DKS', 'M', 'GPS',
  // Entertainment & Media
  'NFLX', 'DIS', 'CMCSA', 'PARA', 'WBD', 'SPOT', 'ROKU', 'EA', 'TTWO', 'ATVI', 'LYV',
  // Telecommunications
  'VZ', 'T', 'TMUS', 'ERIC', 'NOK',
  // Energy
  'XOM', 'CVX', 'COP', 'BP', 'SHEL', 'SLB', 'EOG', 'PXD', 'MPC', 'PSX', 'VLO',
  // Consumer Goods
  'KO', 'PEP', 'PG', 'MCD', 'SBUX', 'NKE', 'YUM', 'EL', 'CL', 'KMB', 'HSY', 'K', 'GIS',
  // Industrial & Manufacturing
  'CAT', 'DE', 'BA', 'LMT', 'RTX', 'HON', 'MMM', 'GE', 'EMR', 'ETN', 'CMI',
  // Real Estate
  'AMT', 'PLD', 'CCI', 'EQIX', 'DLR', 'O', 'SPG', 'WELL', 'AVB',
  // Materials
  'LIN', 'APD', 'ECL', 'DD', 'NEM', 'FCX', 'DOW', 'NUE'
];

// Keep track of stocks that have been shown to the user
let shownStocks = new Set<string>();

// Reset shown stocks if we've shown all available stocks
const resetShownStocksIfNeeded = async () => {
  const { data: availableStocks } = await supabase
    .from('stock_data_cache')
    .select('symbol');
    
  if (shownStocks.size >= (availableStocks?.length || 0)) {
    console.log('Resetting shown stocks history - all stocks have been shown');
    shownStocks.clear();
  }
};

export const generateStockBatch = async (count: number): Promise<Stock[]> => {
  console.log('Generating new stock batch');
  await resetShownStocksIfNeeded();
  
  // Get user's portfolio symbols to exclude them
  const { data: { user } } = await supabase.auth.getUser();
  const { data: portfolioPositions } = await supabase
    .from('paper_trading_positions')
    .select('symbol')
    .eq('user_id', user?.id);
    
  const portfolioSymbols = new Set(portfolioPositions?.map(pos => pos.symbol) || []);
  
  // Get all available stocks from cache that aren't in portfolio
  const { data: availableStocks } = await supabase
    .from('stock_data_cache')
    .select('symbol')
    .not('symbol', 'in', `(${Array.from(portfolioSymbols).join(',')})`)
    .not('symbol', 'in', `(${Array.from(shownStocks).join(',')})`);
    
  if (!availableStocks || availableStocks.length === 0) {
    console.log('No available stocks found, resetting shown stocks');
    shownStocks.clear();
    return generateStockBatch(count);
  }
  
  // Randomly select stocks
  const shuffledStocks = availableStocks
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(stock => stock.symbol);
    
  console.log('Selected stocks for batch:', shuffledStocks);
  
  // Add selected stocks to shown stocks set
  shuffledStocks.forEach(symbol => shownStocks.add(symbol));
  
  // Fetch full stock data for selected symbols
  const stockPromises = shuffledStocks.map(async (symbol) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetchStockData', {
        body: { symbol }
      });

      if (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
      }

      const formattedChartData = data.chartData.map((point: any) => ({
        value: parseFloat(point.value)
      }));

      return {
        id: symbol,
        ...data,
        chartData: formattedChartData
      };
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      throw error;
    }
  });

  try {
    return await Promise.all(stockPromises);
  } catch (error) {
    console.error('Error generating stock batch:', error);
    throw new Error('Failed to load stock data, please try again');
  }
};