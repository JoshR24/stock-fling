import { faker } from '@faker-js/faker';

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  description: string;
  chartData: { time: string; value: number }[];
}

const generateChartData = () => {
  const data = [];
  let value = faker.number.float({ min: 10, max: 100 });
  
  for (let i = 0; i < 20; i++) {
    value = value + faker.number.float({ min: -5, max: 5 });
    data.push({
      time: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.max(0, value)
    });
  }
  return data;
};

export const generateStock = (): Stock => {
  const price = faker.number.float({ min: 10, max: 1000, precision: 0.01 });
  const change = faker.number.float({ min: -10, max: 10, precision: 0.01 });
  
  return {
    id: faker.string.uuid(),
    symbol: faker.finance.currencyCode(),
    name: faker.company.name(),
    price,
    change,
    description: faker.company.catchPhrase(),
    chartData: generateChartData()
  };
};

export const generateStockBatch = (count: number): Stock[] => {
  return Array.from({ length: count }, generateStock);
};