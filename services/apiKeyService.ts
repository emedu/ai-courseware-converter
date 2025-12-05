/**
 * API Key 管理服務
 * 用途：安全地管理使用者的 Google Gemini API Key
 */

const API_KEY_STORAGE_KEY = 'user_gemini_api_key';

/**
 * 取得使用者的 API Key
 * @returns API Key 或 null（如果未設定）
 */
export const getUserApiKey = (): string | null => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
};

/**
 * 儲存使用者的 API Key
 * @param apiKey - Google Gemini API Key
 */
export const setUserApiKey = (apiKey: string): void => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
        throw new Error('API Key 不能為空');
    }

    // 基本驗證：檢查格式
    if (!trimmedKey.startsWith('AIza')) {
        console.warn('⚠️ API Key 格式可能不正確（應以 AIza 開頭）');
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    console.log('✅ API Key 已儲存');
};

/**
 * 清除使用者的 API Key
 */
export const clearUserApiKey = (): void => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    console.log('🗑️ API Key 已清除');
};

/**
 * 檢查是否已設定 API Key
 * @returns true 如果已設定，false 如果未設定
 */
export const hasApiKey = (): boolean => {
    const key = getUserApiKey();
    return !!key && key.length > 0;
};

/**
 * 驗證 API Key 格式
 * @param apiKey - 要驗證的 API Key
 * @returns 驗證結果
 */
export const validateApiKey = (apiKey: string): {
    valid: boolean;
    message: string;
} => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
        return {
            valid: false,
            message: 'API Key 不能為空'
        };
    }

    if (trimmedKey.length < 20) {
        return {
            valid: false,
            message: 'API Key 長度太短'
        };
    }

    if (!trimmedKey.startsWith('AIza')) {
        return {
            valid: false,
            message: 'API Key 格式不正確（應以 AIza 開頭）'
        };
    }

    return {
        valid: true,
        message: 'API Key 格式正確'
    };
};

/**
 * 遮罩 API Key（用於顯示）
 * @param apiKey - 完整的 API Key
 * @returns 遮罩後的 API Key（例如：AIza****...****xyz）
 */
export const maskApiKey = (apiKey: string): string => {
    if (!apiKey || apiKey.length < 10) {
        return '****';
    }

    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 3);
    return `${start}****...****${end}`;
};
