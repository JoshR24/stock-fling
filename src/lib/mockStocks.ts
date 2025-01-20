import { faker } from '@faker-js/faker';

export interface Stock {
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

const generateNews = () => {
  return Array.from({ length: faker.number.int({ min: 3, max: 5 }) }, () => ({
    id: faker.string.uuid(),
    title: faker.company.catchPhrase(),
    summary: faker.lorem.paragraph(),
    date: faker.date.recent({ days: 7 }).toLocaleDateString()
  }));
};

export const generateStock = (): Stock => {
  const price = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
  const change = faker.number.float({ min: -10, max: 10, fractionDigits: 2 });
  
  return {
    id: faker.string.uuid(),
    symbol: faker.finance.currencyCode(),
    name: faker.company.name(),
    price,
    change,
    description: `${faker.company.catchPhrase()}. ${faker.company.buzzPhrase()}. Based in ${faker.location.city()}, the company specializes in ${faker.company.buzzNoun()}.`,
    chartData: generateChartData(),
    news: generateNews()
  };
};

export const generateStockBatch = (count: number): Stock[] => {
  return Array.from({ length: count }, generateStock);
};