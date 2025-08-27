import React, { useState } from 'react';
import axios from 'axios';

interface DiagnosticResult {
  success: boolean;
  message: string;
  polygon: {
    available: boolean;
    error?: string;
    testDetails?: any;
  };
  environment: {
    nodeEnv: string;
    hasPolygonKey: boolean;
    polygonKeyPrefix: string;
  };
  timestamp: string;
  cacheCleared: boolean;
}

interface PolygonDiagnosticProps {
  onRefresh?: () => void;
  apiBaseUrl: string;
}

const PolygonDiagnostic: React.FC<PolygonDiagnosticProps> = ({ onRefresh, apiBaseUrl }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setDiagnosticResult(null);
    
    try {
      console.log('🔧 开始Polygon.io状态诊断...');
      
      const response = await axios.post(`${apiBaseUrl}/api/data-sources/refresh`);
      setDiagnosticResult(response.data);
      
      // 刷新父组件的状态
      if (onRefresh) {
        setTimeout(onRefresh, 1000); // 给服务器一点时间处理
      }
      
    } catch (error: any) {
      console.error('诊断失败:', error);
      setDiagnosticResult({
        success: false,
        message: '诊断失败',
        polygon: {
          available: false,
          error: error.message || '网络错误'
        },
        environment: {
          nodeEnv: 'unknown',
          hasPolygonKey: false,
          polygonKeyPrefix: 'unknown'
        },
        timestamp: new Date().toISOString(),
        cacheCleared: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDiagnosticMessage = () => {
    if (!diagnosticResult) return null;

    const { polygon, environment } = diagnosticResult;

    if (polygon.available) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 text-xl mr-2">✅</div>
            <div>
              <h4 className="text-green-800 font-medium">Polygon.io API 连接正常</h4>
              <p className="text-green-700 text-sm mt-1">
                API密钥已配置且工作正常
              </p>
              {polygon.testDetails && (
                <div className="mt-2 text-xs text-green-600">
                  <p>响应时间: {polygon.testDetails.responseTime}</p>
                  <p>测试价格: ${polygon.testDetails.testPrice}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const getErrorMessage = () => {
      if (polygon.error?.includes('Authentication Failed') || polygon.error?.includes('401')) {
        return '❌ API密钥无效或已过期';
      }
      if (polygon.error?.includes('Rate Limited') || polygon.error?.includes('429')) {
        return '⏰ API调用频率超限，请稍后重试';
      }
      if (polygon.error?.includes('Access Denied') || polygon.error?.includes('403')) {
        return '🚫 API权限不足，可能需要升级账户';
      }
      if (polygon.error?.includes('API密钥未配置')) {
        return '🔑 需要在Vercel环境变量中配置POLYGON_API_KEY';
      }
      return `⚠️ 连接错误: ${polygon.error}`;
    };

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-yellow-600 text-xl mr-2">⚠️</div>
          <div className="flex-1">
            <h4 className="text-yellow-800 font-medium">Polygon.io API 连接问题</h4>
            <p className="text-yellow-700 text-sm mt-1">{getErrorMessage()}</p>
            
            <div className="mt-3 text-xs text-yellow-600">
              <p><strong>环境信息:</strong></p>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• 环境: {environment.nodeEnv}</li>
                <li>• API密钥配置: {environment.hasPolygonKey ? '已配置' : '未配置'}</li>
                {environment.hasPolygonKey && (
                  <li>• 密钥前缀: {environment.polygonKeyPrefix}</li>
                )}
              </ul>
            </div>

            {!environment.hasPolygonKey && (
              <div className="mt-3 bg-yellow-100 rounded p-2 text-xs">
                <p className="font-medium text-yellow-800">解决方案:</p>
                <ol className="ml-4 mt-1 space-y-1 text-yellow-700">
                  <li>1. 访问 <a href="https://polygon.io" target="_blank" rel="noopener noreferrer" className="underline">polygon.io</a> 获取API密钥</li>
                  <li>2. 在Vercel项目设置中添加环境变量 POLYGON_API_KEY</li>
                  <li>3. 重新部署应用或等待自动部署</li>
                  <li>4. 刷新页面并重新测试</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 诊断按钮 */}
      <button
        onClick={() => setShowDiagnostic(!showDiagnostic)}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        {showDiagnostic ? '隐藏诊断' : 'Polygon.io状态诊断'}
      </button>

      {showDiagnostic && (
        <div className="mt-4 bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-800">Polygon.io API 诊断工具</h3>
            <button
              onClick={runDiagnostic}
              disabled={isLoading}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '诊断中...' : '刷新状态'}
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center text-gray-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              正在检测Polygon.io API连接状态...
            </div>
          )}

          {diagnosticResult && getDiagnosticMessage()}

          {!isLoading && !diagnosticResult && (
            <p className="text-gray-500 text-sm">
              点击"刷新状态"按钮开始诊断Polygon.io API连接问题
            </p>
          )}

          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <p><strong>说明：</strong></p>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• 此工具会清除缓存并重新检测API连接状态</li>
              <li>• 如果环境变量刚刚在Vercel中配置，可能需要等待部署完成</li>
              <li>• 诊断过程会消耗1次API调用配额</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default PolygonDiagnostic;