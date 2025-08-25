import React from 'react';
import { OptionRecommendation } from '../types';

interface RecommendationsListProps {
  recommendations: OptionRecommendation[];
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({ 
  recommendations 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">推荐策略</h3>
      </div>
      <div className="p-6">
        {recommendations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            暂无推荐策略，请先进行分析
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      rec.type === 'PUT' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {rec.type === 'PUT' ? '看跌期权' : '看涨期权'}
                    </span>
                    <div className="mt-1">
                      <span className="text-lg font-semibold">
                        执行价: ${rec.strike}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        到期: {rec.expiration}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(rec.premium)}
                    </div>
                    <div className="text-sm text-gray-500">权利金</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">成功概率</div>
                    <div className="font-semibold text-blue-600">
                      {formatPercentage(rec.probability)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">最大收益</div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(rec.maxProfit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">最大损失</div>
                    <div className="font-semibold text-red-600">
                      {formatCurrency(rec.maxLoss)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">年化收益率</div>
                    <div className="font-semibold text-purple-600">
                      {formatPercentage(rec.annualizedReturn)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    盈亏平衡点: <span className="font-semibold">${rec.breakeven}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsList;