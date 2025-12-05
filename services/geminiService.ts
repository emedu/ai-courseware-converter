

import { GoogleGenAI, Type } from "@google/genai";
import { StructuredContentItem } from '../types';
import { getUserApiKey } from './apiKeyService';

/**
 * 取得 Google Gemini AI 實例
 * 動態從 localStorage 讀取 API Key，而非硬編碼
 */
const getAI = (): GoogleGenAI => {
    // 優先使用使用者設定的 API Key
    const userApiKey = getUserApiKey();

    // 如果使用者未設定，則使用環境變數（開發時）
    const apiKey = userApiKey || process.env.API_KEY;

    if (!apiKey) {
        throw new Error(
            '🔑 未設定 API Key\n\n' +
            '請在設定中輸入您的 Google Gemini API Key\n\n' +
            '如何取得 API Key：\n' +
            '1. 前往 https://ai.google.dev\n' +
            '2. 點擊「Get API Key」\n' +
            '3. 複製 API Key 並在設定中貼上'
        );
    }

    return new GoogleGenAI({ apiKey });
};

// FUNCTION FOR STEP 1: Get AI Suggestions
export const getAISuggestions = async (rawMarkdown: string): Promise<string> => {
    const prompt = `
    您是一位專業的教材設計師，具備嚴格的內容審核標準。您的任務是分析使用者提供的原始 Markdown 文字，並在適當的位置插入結構化建議標籤以增強內容的可讀性與專業性。

    核心規則：
    1.  **完整保留所有原始文字**，不得刪減或修改。
    2.  **嚴格篩選重點 (Strictly Select Key Points)**：
        -   **寧缺勿濫原則**：請記住，「如果每一句話都是重點，那就沒有重點了」。
        -   **什麼是重點**：只有「核心結論」、「黃金法則」、「如果不遵守會導致失敗的關鍵警告」或「反直覺的洞察」才配得上 \`[建議:重點提示]\`。
        -   **什麼不是重點**：一般的背景說明、操作流程敘述、名詞解釋、普通的建議，請**不要**標記為重點。
        -   **比例控制**：整份文件中，被標記為重點提示的內容**不應超過總篇幅的 10%**。
    3.  **絕對不要生成目錄**：請**不要**在建議階段插入 \`[目錄]\` 標籤。我們將在前端自動生成全域目錄。
    4.  **使用的建議標籤格式**：
        -   \`[建議:重點提示] 需要強調的文字\` (極度克制使用，僅限於精華中的精華)
        -   \`[建議:警告事項] 需要警告的文字\` (用於操作風險提示)
        -   \`[建議:案例分析] 案例內容\`
        -   \`[建議:定義] 術語: 解釋\`
        -   \`[建議:插入圖片]\` (此標籤獨立一行，用於長篇文字後或概念轉換處)
    5.  您的輸出**只能是**經過您增強後的 Markdown 文字，不要包含任何額外的解釋或開頭語、結尾語。

    這是使用者的原始內容：
    ---
    ${rawMarkdown}
    ---
    `;

    try {
        const ai = getAI(); // 動態取得 AI 實例
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error: any) {
        console.error("❌ AI Suggestions Error:", error);

        // 詳細的錯誤分類
        const errorMessage = error?.message || '';
        const errorStatus = error?.status || error?.response?.status;

        // API Key 相關錯誤
        if (errorMessage.includes('API key') || errorMessage.includes('API_KEY') || errorStatus === 401) {
            throw new Error(
                '🔑 API Key 錯誤\n\n' +
                '原因：API Key 無效、未設定或已過期\n\n' +
                '解決方法：\n' +
                '1. 檢查 .env.local 檔案中的 GEMINI_API_KEY\n' +
                '2. 確認 API Key 格式正確（應以 AIza 開頭）\n' +
                '3. 前往 https://ai.google.dev 重新產生 API Key'
            );
        }

        // 配額用盡
        if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorStatus === 429) {
            throw new Error(
                '📊 API 配額已用盡\n\n' +
                '原因：已達到免費額度或請求過於頻繁\n\n' +
                '解決方法：\n' +
                '1. 等待一段時間後再試（通常每分鐘限制 60 次）\n' +
                '2. 檢查 Google AI Studio 的配額使用情況\n' +
                '3. 考慮升級到付費方案'
            );
        }

        // 網路超時
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || error?.code === 'ETIMEDOUT') {
            throw new Error(
                '⏱️ 請求超時\n\n' +
                '原因：網路連線不穩定或 AI 處理時間過長\n\n' +
                '解決方法：\n' +
                '1. 檢查網路連線\n' +
                '2. 重新嘗試\n' +
                '3. 如果內容過長，請嘗試分段處理'
            );
        }

        // 伺服器錯誤
        if (errorStatus === 500 || errorStatus === 503) {
            throw new Error(
                '🔧 AI 服務暫時無法使用\n\n' +
                '原因：Google AI 伺服器發生問題\n\n' +
                '解決方法：\n' +
                '1. 稍後再試（通常幾分鐘內會恢復）\n' +
                '2. 檢查 Google AI 服務狀態：https://status.cloud.google.com'
            );
        }

        // 內容過長
        if (errorMessage.includes('too long') || errorMessage.includes('token limit')) {
            throw new Error(
                '📄 內容過長\n\n' +
                '原因：文件超過 AI 處理上限\n\n' +
                '解決方法：\n' +
                '1. 將文件分成多個較小的部分\n' +
                '2. 刪除不必要的內容\n' +
                '3. 每次處理約 5000 字以內'
            );
        }

        // 網路連線錯誤
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || error?.code === 'ENOTFOUND') {
            throw new Error(
                '🌐 網路連線失敗\n\n' +
                '原因：無法連接到 Google AI 服務\n\n' +
                '解決方法：\n' +
                '1. 檢查網路連線\n' +
                '2. 確認防火牆未封鎖連線\n' +
                '3. 嘗試使用 VPN（如果在中國大陸）'
            );
        }

        // 其他未知錯誤
        throw new Error(
            `❌ AI 服務發生錯誤\n\n` +
            `錯誤訊息：${errorMessage || '未知錯誤'}\n\n` +
            `建議：\n` +
            `1. 檢查網路連線\n` +
            `2. 確認 API Key 設定正確\n` +
            `3. 稍後再試\n` +
            `4. 如果問題持續，請聯絡技術支援`
        );
    }
};


// FUNCTION FOR STEP 2: Generate Structured Content
const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: "內容區塊的類型 (例如: 'chapter_title', 'paragraph', 'table')." },
            content: { type: Type.STRING, description: "區塊的主要文字內容." },
            id: { type: Type.STRING, description: "用於圖片建議的唯一 ID." },
            precedingText: { type: Type.STRING, description: "在圖片建議之前的文字." },
            term: { type: Type.STRING, description: "被定義的術語." },
            definition: { type: Type.STRING, description: "術語的定義." },
            label: { type: Type.STRING, description: "用於表單欄位或核取方塊組的標籤文字." },
            options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "核取方塊組的選項列表."
            },
            steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "操作步驟的列表."
            },
            headers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "表格的標頭欄位."
            },
            rows: {
                type: Type.ARRAY,
                items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                description: "表格的行數據，為字串陣列的陣列."
            }
        },
        required: ['type']
    }
};


export const analyzeContent = async (markdownContent: string): Promise<StructuredContentItem[]> => {
    const prompt = `
    您是一位專業的教材設計與文件格式化助理。您的任務是嚴格按照規則，分析提供的 Markdown 內容，並將其結構化為符合所提供 schema 的 JSON 格式。

    **核心任務與流程：**
    1.  **絕對禁止生成目錄 (NO Table of Contents):** 無論原始 Markdown 是否包含 "目錄"、"Contents" 或類似列表，您**絕對不要**生成 'toc' 類型的物件。也不要將原始目錄轉換為 paragraph。**直接忽略目錄部分**。我們將在前端根據標題自動生成全域總目錄。
    2.  **內容清理與結構化:** 將剩餘內容轉換為結構化物件。

    **標籤處理與清理規則 (CRITICAL - Tag Cleaning Rules):**
    原始文字中包含 Step 1 生成的建議標籤 (例如 \`[建議:定義]\`)。在生成 JSON 時，您必須**移除這些標籤**，只保留內容。
    -   \`[建議:重點提示] 內容...\` -> type: 'key_point', content: '內容...' (移除標籤!)
    -   \`[建議:警告事項] 內容...\` -> type: 'warning_box', content: '內容...' (移除標籤!)
    -   \`[建議:案例分析] 內容...\` -> type: 'case_study', content: '內容...' (移除標籤!)
    -   \`[建議:定義] 術語: 解釋...\` -> type: 'definition', term: '術語', definition: '解釋...' (移除標籤!)
    -   \`[建議:插入圖片]\` -> type: 'image_suggestion'
    -   \`[圖片已匯入: ID]\` -> type: 'image_suggestion', id: 'ID'

    **表格處理的絕對鐵律 (Strict Rules for Table Processing)：**
    -   處理 Markdown 表格時，必須將儲存格內容轉換為字串。
    -   **重要:** 檢查儲存格內是否有 \`[建議:...]\` 標籤。如果有，**必須移除標籤文字**，只保留實際內容。例如 " [建議:定義] 開放性粉刺" 必須變成 "開放性粉刺"。
    -   **JSON 有效性 (CRITICAL - AVOID JSON ERRORS):**
        -   儲存格內的文字必須是**單行字串**。
        -   **禁止真實換行 (No raw newlines):** 字串中的換行必須替換為空格或 \`\\n\` (escaped newline)。絕對不可以在 JSON 值中出現真實的換行符號。
        -   **嚴格轉義:** 雙引號 \`"\` 必須轉義為 \`\\"\`。

    **層級結構識別規則:**
    -   '# text' -> 'chapter_title'
    -   '## text' -> 'section_title'
    -   '### text' -> 'subsection_title'
    -   '[操作步驟] ... [/操作步驟]' -> 'steps_list'
    -   '文字：________' -> 'form_field'
    -   '□ 選項' -> 'checkbox_group'
    -   其餘文字 -> 'paragraph'

    **格式化規則：**
    -   將 Markdown 粗體 (\`**text**\`) 轉換為 HTML (\`<strong>text</strong>\`)。
    -   **再次強調:** 確保所有 JSON 字串值都經過正確跳脫。

    現在，請分析這段內容：
    ---
    ${markdownContent}
    ---
    `;

    try {
        const ai = getAI(); // 動態取得 AI 實例
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const rawText = response.text;

        // Remove potential markdown code block formatting if present
        const cleanText = rawText.replace(/^```json\n/, '').replace(/\n```$/, '');

        try {
            return JSON.parse(cleanText) as StructuredContentItem[];
        } catch (parseError) {
            // JSON 解析錯誤
            console.error("❌ JSON Parse Error:", parseError);
            console.error("Raw response:", rawText);

            throw new Error(
                '📋 內容格式化失敗\n\n' +
                '原因：AI 產生的格式不正確\n\n' +
                '解決方法：\n' +
                '1. 重新嘗試（AI 有時會產生不同結果）\n' +
                '2. 檢查內容是否包含特殊字元（如表格中的引號）\n' +
                '3. 嘗試簡化內容或分段處理'
            );
        }

    } catch (error: any) {
        // 如果是上面的 JSON 解析錯誤，直接拋出
        if (error.message?.includes('內容格式化失敗')) {
            throw error;
        }

        console.error("❌ Content Analysis Error:", error);

        const errorMessage = error?.message || '';
        const errorStatus = error?.status || error?.response?.status;

        // API Key 錯誤
        if (errorMessage.includes('API key') || errorStatus === 401) {
            throw new Error('🔑 API Key 錯誤\n\n請檢查 .env.local 中的 GEMINI_API_KEY 設定');
        }

        // 配額用盡
        if (errorMessage.includes('quota') || errorStatus === 429) {
            throw new Error('📊 API 配額已用盡\n\n請稍後再試或檢查配額使用情況');
        }

        // 內容過長
        if (errorMessage.includes('too long') || errorMessage.includes('token limit')) {
            throw new Error(
                '📄 內容過長\n\n' +
                '解決方法：\n' +
                '1. 將內容分成多個較小的部分\n' +
                '2. 每次處理約 5000 字以內'
            );
        }

        // 網路錯誤
        if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
            throw new Error('🌐 網路連線問題\n\n請檢查網路連線後重試');
        }

        // 其他錯誤
        throw new Error(
            `❌ 內容分析失敗\n\n` +
            `錯誤訊息：${errorMessage || '未知錯誤'}\n\n` +
            `建議：重新嘗試或簡化內容`
        );
    }
};
