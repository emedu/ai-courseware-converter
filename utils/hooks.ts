import { useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * 自訂 Hook：防抖（Debounce）
 * 用途：延遲執行函數，避免頻繁觸發
 * 
 * @param callback - 要延遲執行的函數
 * @param delay - 延遲時間（毫秒）
 * @returns 防抖後的函數
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout>();

    return useCallback(
        (...args: Parameters<T>) => {
            // 清除之前的計時器
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // 設定新的計時器
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    ) as T;
}

/**
 * 自訂 Hook：節流（Throttle）
 * 用途：限制函數執行頻率
 * 
 * @param callback - 要限制執行的函數
 * @param delay - 最小間隔時間（毫秒）
 * @returns 節流後的函數
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const lastRun = useRef(Date.now());

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();

            if (now - lastRun.current >= delay) {
                callback(...args);
                lastRun.current = now;
            }
        },
        [callback, delay]
    ) as T;
}

/**
 * 自訂 Hook：深度比較的 useMemo
 * 用途：只在物件內容真正改變時才更新
 * 
 * @param value - 要監控的值
 * @returns 穩定的值引用
 */
export function useDeepMemo<T>(value: T): T {
    const ref = useRef<T>(value);
    const stringified = JSON.stringify(value);

    return useMemo(() => {
        const newStringified = JSON.stringify(value);
        if (newStringified !== stringified) {
            ref.current = value;
        }
        return ref.current;
    }, [stringified]);
}

/**
 * 自訂 Hook：自動儲存
 * 用途：智慧地自動儲存資料，避免不必要的儲存操作
 * 
 * @param data - 要儲存的資料
 * @param onSave - 儲存函數
 * @param delay - 延遲時間（毫秒），預設 500ms
 */
export function useAutoSave<T>(
    data: T,
    onSave: (data: T) => void,
    delay: number = 500
): void {
    // 使用深度比較，只在內容真正改變時才觸發
    const stableData = useDeepMemo(data);

    // 使用防抖，避免頻繁儲存
    const debouncedSave = useDebounce(onSave, delay);

    useEffect(() => {
        debouncedSave(stableData);
    }, [stableData, debouncedSave]);
}

/**
 * 自訂 Hook：儲存狀態指示器
 * 用途：追蹤儲存狀態（儲存中、已儲存、錯誤）
 * 
 * @param data - 要儲存的資料
 * @param onSave - 儲存函數（可能是 async）
 * @param delay - 延遲時間（毫秒）
 * @returns 儲存狀態
 */
export function useAutoSaveWithStatus<T>(
    data: T,
    onSave: (data: T) => void | Promise<void>,
    delay: number = 500
): 'idle' | 'saving' | 'saved' | 'error' {
    const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const stableData = useDeepMemo(data);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // 清除之前的計時器
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // 設定儲存中狀態
        setStatus('saving');

        // 延遲執行儲存
        timeoutRef.current = setTimeout(async () => {
            try {
                await onSave(stableData);
                setStatus('saved');

                // 2 秒後重置為 idle
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                console.error('Auto-save error:', error);
                setStatus('error');
            }
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [stableData, onSave, delay]);

    return status;
}

// 需要在檔案頂部加入 React import（如果使用 useAutoSaveWithStatus）
import React from 'react';
