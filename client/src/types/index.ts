export interface OptionContract {
  ticker: string;
  strike_price: number;
  expiration_date: string;
  contract_type: 'call' | 'put';
  underlying_ticker: string;
}

export interface StockData {
  ticker?: string;
  symbol?: string;
  queryCount?: number;
  resultsCount?: number;
  adjusted?: boolean;
  currentPrice?: number;
  previousClose?: number;
  currency?: string;
  exchange?: string;
  timestamp?: string;
  dataSource?: string;
  results?: Array<{
    T?: string;
    v?: number;
    vw?: number;
    o?: number;
    c?: number;
    h?: number;
    l?: number;
    t?: number;
    n?: number;
  }>;
}

export interface OptionRecommendation {
  type: 'PUT' | 'CALL';
  strike: number;
  expiration: string;
  premium: number;
  bid?: number;
  ask?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
  probability: number;
  maxProfit: number;
  maxLoss: number;
  breakeven: number;
  annualizedReturn: number;
  dataSource?: string;
}

export interface AnalysisResult {
  symbol: string;
  strategy: string;
  currentPrice?: number;
  stockData?: StockData;
  recommendations: OptionRecommendation[];
  riskMetrics: {
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
  };
  dataSourceInfo?: {
    primary?: string;
    optionsSource?: string;
    polygonStatus?: string;
    futuAPIStatus?: string;
    quality?: string;
    cost?: string;
    fallbackReason?: string;
    note?: string;
  };
  timestamp?: string;
  dataSource?: string;
}