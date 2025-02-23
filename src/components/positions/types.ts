
import { Stock } from "@/lib/mockStocks";

export interface Position {
  symbol: string;
  quantity: number;
  average_price: number;
}

export interface StockPrice {
  symbol: string;
  currentPrice: number;
  change: number;
}

export interface PortfolioPositionsProps {
  stocks: Stock[];
}

export interface PortfolioData {
  positions: Position[];
  stockPrices: StockPrice[];
}

export interface PortfolioTotals {
  totalValue: number;
  totalGainLoss: number;
}
