import React, { useState, useEffect, useCallback } from 'react';
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
  const [dataSource, setDataSource] = useState<string>('auto'); // 新增：数据源选择
  const [dataSourceStatus, setDataSourceStatus] = useState<any>(null); // 新增：数据源状态

  // 在生产环境（如Vercel）中使用相对路径，开发环境使用localhost
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '' // 生产环境使用相对路径，Vercel会自动代理到serverless函数
    : process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // 新增：获取数据源状态
  const fetchDataSourceStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/data-sources/status`);
      setDataSourceStatus(response.data);
    } catch (error) {
      console.error('获取数据源状态失败:', error);
    }
  }, [API_BASE_URL]);

  const fetchStockData = useCallback(async (ticker: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stock/${ticker}`);
      setStockData(response.data);
    } catch (error) {
      console.error('获取股票数据失败:', error);
    }
  }, [API_BASE_URL]);

  const analyzeOptions = async () => {
    setLoading(true);
    try {
      // 根据数据源选择使用不同的API端点
      let endpoint = '/api/analyze-v2'; // 默认端点
      
      switch (dataSource) {
        case 'polygon':
          endpoint = '/api/analyze-polygon';
          break;
        case 'futu':
          endpoint = '/api/analyze-futu';
          break;
        case 'yahoo':
          endpoint = '/api/analyze-v2';
          break;
        case 'auto':
        default:
          // 自动选择：优先使用Polygon.io
          if (dataSourceStatus?.polygon?.available) {
            endpoint = '/api/analyze-polygon';
          } else if (dataSourceStatus?.futu?.available) {
            endpoint = '/api/analyze-futu';
          } else {
            endpoint = '/api/analyze-v2';
          }
          break;
      }
      
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
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
  }, [symbol, fetchStockData]);

  // 新增：页面加载时获取数据源状态
  useEffect(() => {
    fetchDataSourceStatus();
  }, [fetchDataSourceStatus]);

  const currentPrice = analysis?.currentPrice || stockData?.currentPrice || stockData?.results?.[0]?.c || 0;

  // 新增：数据源状态显示组件
  const DataSourceIndicator = () => {
    if (!dataSourceStatus) return null;

    const { polygon, futu, yahoo, simulation } = dataSourceStatus;
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">数据源状态</h3>
        <div className="flex space-x-4 text-xs">
          <div className={`flex items-center space-x-1 ${polygon?.available ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${polygon?.available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Polygon.io {polygon?.available ? '已连接' : '未配置'}</span>
            {polygon?.available && <span className="bg-green-100 text-green-800 px-1 rounded text-xs">专业级</span>}
          </div>
          <div className={`flex items-center space-x-1 ${futu?.available ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${futu?.available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>富途API {futu?.available ? '已连接' : '未连接'}</span>
          </div>
          <div className={`flex items-center space-x-1 ${yahoo?.available ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${yahoo?.available ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Yahoo Finance {yahoo?.available ? '可用' : '受限'}</span>
          </div>
          <div className="flex items-center space-x-1 text-blue-600">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>智能模拟 可用</span>
          </div>
        </div>
        {polygon?.available && (
          <div className="mt-2 text-xs text-green-600">
            ✨ 推荐使用Polygon.io获取最准确的期权数据
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 数据源状态显示 */}
      <DataSourceIndicator />
      
      {/* 搜索和配置区域 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">分析配置</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SymbolSearch 
            symbol={symbol} 
            onSymbolChange={setSymbol}
            currentPrice={currentPrice}
          />
          <StrategySelector 
            strategy={strategy} 
            onStrategyChange={setStrategy} 
          />
          {/* 新增：数据源选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              数据源
            </label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="auto">自动选择 (推荐)</option>
              <option 
                value="polygon" 
                disabled={!dataSourceStatus?.polygon?.available}
              >
                Polygon.io {!dataSourceStatus?.polygon?.available ? '(未配置)' : '(专业级)'}
              </option>
              <option 
                value="futu" 
                disabled={!dataSourceStatus?.futu?.available}
              >
                富途API {!dataSourceStatus?.futu?.available ? '(未连接)' : '(交易级)'}
              </option>
              <option value="yahoo">Yahoo Finance (免费)</option>
            </select>
            {dataSource === 'polygon' && !dataSourceStatus?.polygon?.available && (
              <div className="mt-1 text-xs text-amber-600">
                需要配置Polygon.io API密钥
              </div>
            )}
          </div>
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
          {/* 新增：数据源信息显示 */}
          {analysis?.dataSourceInfo && (
            <div className="mt-2 text-xs text-gray-500">
              数据来源: {analysis.dataSourceInfo.primary} 
              {analysis.dataSourceInfo.optionsSource && 
                ` | 期权: ${analysis.dataSourceInfo.optionsSource}`
              }
            </div>
          )}
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