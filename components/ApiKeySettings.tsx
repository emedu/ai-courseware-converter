import React, { useState } from 'react';
import { getUserApiKey, setUserApiKey, clearUserApiKey, validateApiKey, maskApiKey } from '../services/apiKeyService';

const ApiKeySettings: React.FC = () => {
    const [apiKey, setApiKey] = useState(getUserApiKey() || '');
    const [showKey, setShowKey] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    const handleSave = () => {
        const validation = validateApiKey(apiKey);

        if (!validation.valid) {
            setMessage(validation.message);
            setMessageType('error');
            return;
        }

        try {
            setUserApiKey(apiKey);
            setMessage('✅ API Key 已儲存！');
            setMessageType('success');

            // 3 秒後清除訊息
            setTimeout(() => {
                setMessage('');
                setMessageType('');
            }, 3000);
        } catch (error) {
            setMessage(`❌ 儲存失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
            setMessageType('error');
        }
    };

    const handleClear = () => {
        if (confirm('確定要清除 API Key 嗎？')) {
            clearUserApiKey();
            setApiKey('');
            setMessage('🗑️ API Key 已清除');
            setMessageType('success');

            setTimeout(() => {
                setMessage('');
                setMessageType('');
            }, 3000);
        }
    };

    const currentKey = getUserApiKey();

    return (
        <div className="api-key-settings p-6 bg-white rounded-lg shadow-md max-w-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
                🔑 Google Gemini API Key 設定
            </h3>

            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-gray-700 mb-2">
                    <strong>為什麼需要 API Key？</strong>
                </p>
                <p className="text-sm text-gray-600">
                    本工具使用 Google Gemini AI 來分析和格式化您的教材。
                    為了保護安全性，請使用您自己的 API Key。
                </p>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                    <strong>如何取得 API Key：</strong>
                </p>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                    <li>前往 <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://ai.google.dev</a></li>
                    <li>點擊「Get API Key」或「建立 API 金鑰」</li>
                    <li>複製您的 API Key</li>
                    <li>在下方輸入並儲存</li>
                </ol>
            </div>

            {currentKey && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                        ✅ 目前已設定 API Key: <code className="bg-green-100 px-2 py-1 rounded">{maskApiKey(currentKey)}</code>
                    </p>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                </label>
                <div className="flex gap-2">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                        title={showKey ? '隱藏' : '顯示'}
                    >
                        {showKey ? '🙈 隱藏' : '👁️ 顯示'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                        messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                            'bg-gray-50 border border-gray-200 text-gray-800'
                    }`}>
                    {message}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                    💾 儲存
                </button>
                {currentKey && (
                    <button
                        onClick={handleClear}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                        🗑️ 清除
                    </button>
                )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-800">
                    <strong>⚠️ 隱私說明：</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                    您的 API Key 只會儲存在您的瀏覽器中（LocalStorage），
                    不會上傳到任何伺服器。請妥善保管您的 API Key。
                </p>
            </div>
        </div>
    );
};

export default ApiKeySettings;
