import React from 'react';

interface SymbolSearchProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  currentPrice: number;
}

const SymbolSearch: React.FC<SymbolSearchProps> = ({ 
  symbol, 
  onSymbolChange, 
  currentPrice 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        股票代码
      </label>
      <div className="space-y-2">
        <input
          type="text"
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
          placeholder="输入股票代码 (如: AAPL)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {currentPrice > 0 && (
          <div className="text-sm text-gray-600">
            当前价格: ${currentPrice.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SymbolSearch;