import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnalysisResult, StockData } from '../types';
import SymbolSearch from './SymbolSearch';
import StrategySelector from './StrategySelector';
import RecommendationsList from './RecommendationsList';
import RiskMetrics from './RiskMetrics';

const OptionsAnalyzer: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [strategy, setStrategy] = useState<string>('cash-secured-put');
  const [riskTolerance, setRiskTolerance] = useState<string>('moderate');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const fetchStockData = async (ticker: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stock/${ticker}`);
      setStockData(response.data);
    } catch (error) {
      console.error('获取股票数据失败:', error);
    }
  };

  const analyzeOptions = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        symbol,
        strategy,
        riskTolerance
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchStockData(symbol);
    }
  }, [symbol]);

  const currentPrice = stockData?.results?.[0]?.c || 0;

  return (
    <div className="space-y-8">
      {/* 搜索和配置区域 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">分析配置</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SymbolSearch 
            symbol={symbol} 
            onSymbolChange={setSymbol}
            currentPrice={currentPrice}
          />
          <StrategySelector 
            strategy={strategy} 
            onStrategyChange={setStrategy} 
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              风险承受度
            </label>
            <select
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="conservative">保守型</option>
              <option value="moderate">稳健型</option>
              <option value="aggressive">激进型</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={analyzeOptions}
            disabled={loading || !symbol}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '分析中...' : '开始分析'}
          </button>
        </div>
      </div>

      {/* 分析结果 */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecommendationsList recommendations={analysis.recommendations} />
          </div>
          <div>
            <RiskMetrics metrics={analysis.riskMetrics} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsAnalyzer;