import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              美股期权卖方分析系统
            </h1>
            <p className="text-gray-600 mt-1">
              专业的期权卖方策略推荐和风险分析平台
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              数据来源: Polygon.io
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;