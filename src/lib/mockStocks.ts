import { faker } from "@faker-js/faker";

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  chartData: { value: number }[];
  description: string;
  news: {
    id: string;
    title: string;
    summary: string;
    url: string;
    date: string;
  }[];
}

export const generateStockBatch = async (count: number, symbols?: string[]): Promise<Stock[]> => {
  const stocks: Stock[] = [];
  
  for (let i = 0; i < count; i++) {
    const symbol = symbols ? symbols[i] : faker.finance.currencyCode();
    
    const chartData = Array.from({ length: 20 }, () => ({
      value: parseFloat(faker.finance.amount(10, 1000, 2)),
    }));

    const news = Array.from({ length: 5 }, (_, index) => ({
      id: `${symbol}-news-${index + 1}`,
      url: faker.internet.url(),
      date: faker.date.recent().toLocaleDateString(),
      title: faker.lorem.sentence(),
      summary: faker.lorem.paragraph(),
    }));

    stocks.push({
      id: symbols ? symbols[i] : faker.string.uuid(),
      name: `${symbol} Inc`,
      news,
      price: parseFloat(faker.finance.amount(10, 1000, 2)),
      change: parseFloat(faker.finance.amount(-5, 5, 4)),
      symbol,
      chartData,
      description: `${symbol} Inc is a publicly traded company.`,
    });
  }

  return stocks;
};