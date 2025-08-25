import React from 'react';

interface StrategySelectorProps {
  strategy: string;
  onStrategyChange: (strategy: string) => void;
}

const StrategySelector: React.FC<StrategySelectorProps> = ({ 
  strategy, 
  onStrategyChange 
}) => {
  const strategies = [
    { value: 'cash-secured-put', label: '现金担保看跌期权' },
    { value: 'covered-call', label: '备兑看涨期权' },
    { value: 'naked-put', label: '裸卖看跌期权' },
    { value: 'naked-call', label: '裸卖看涨期权' },
    { value: 'iron-condor', label: '铁鹰策略' },
    { value: 'strangle', label: '宽跨式策略' }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        期权策略
      </label>
      <select
        value={strategy}
        onChange={(e) => onStrategyChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {strategies.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StrategySelector;