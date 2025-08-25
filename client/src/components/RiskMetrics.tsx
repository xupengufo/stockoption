import React from 'react';

interface RiskMetricsProps {
  metrics: {
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
  };
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ metrics }) => {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRiskLevel = (drawdown: number) => {
    if (drawdown < 0.1) return { level: '低风险', color: 'text-green-600' };
    if (drawdown < 0.2) return { level: '中等风险', color: 'text-yellow-600' };
    return { level: '高风险', color: 'text-red-600' };
  };

  const getPerformanceRating = (sharpe: number) => {
    if (sharpe > 1.5) return { rating: '优秀', color: 'text-green-600' };
    if (sharpe > 1.0) return { rating: '良好', color: 'text-blue-600' };
    if (sharpe > 0.5) return { rating: '一般', color: 'text-yellow-600' };
    return { rating: '较差', color: 'text-red-600' };
  };

  const riskLevel = getRiskLevel(metrics.maxDrawdown);
  const performance = getPerformanceRating(metrics.sharpeRatio);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">风险指标</h3>
      </div>
      <div className="p-6 space-y-6">
        {/* 最大回撤 */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">最大回撤</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(metrics.maxDrawdown)}
            </div>
          </div>
          <div className={`text-sm font-semibold ${riskLevel.color}`}>
            {riskLevel.level}
          </div>
        </div>

        {/* 夏普比率 */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">夏普比率</div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
          </div>
          <div className={`text-sm font-semibold ${performance.color}`}>
            {performance.rating}
          </div>
        </div>

        {/* 胜率 */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">历史胜率</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(metrics.winRate)}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 ml-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.winRate * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 风险提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                风险提示
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>期权交易存在重大风险，可能导致全部投资损失。请确保您完全理解相关风险并具备相应的风险承受能力。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMetrics;