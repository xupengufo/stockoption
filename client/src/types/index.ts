export interface OptionContract {
  ticker: string;
  strike_price: number;
  expiration_date: string;
  contract_type: 'call' | 'put';
  underlying_ticker: string;
}

export interface StockData {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    T: string;
    v: number;
    vw: number;
    o: number;
    c: number;
    h: number;
    l: number;
    t: number;
    n: number;
  }>;
}

export interface OptionRecommendation {
  type: 'PUT' | 'CALL';
  strike: number;
  expiration: string;
  premium: number;
  probability: number;
  maxProfit: number;
  maxLoss: number;
  breakeven: number;
  annualizedReturn: number;
}

export interface AnalysisResult {
  symbol: string;
  strategy: string;
  recommendations: OptionRecommendation[];
  riskMetrics: {
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
  };
}