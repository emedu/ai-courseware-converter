# AI 教材轉換器 (AI Courseware Converter) - 開發者手冊

## 1. 專案概述

本專案是一個基於 Web 的智慧教材製作工具，旨在協助教育訓練人員將純文字或 Word 文件，透過 Google Gemini AI 的語意分析，自動轉換為排版精美、結構清晰的 PDF 教材。

### 1.1 核心功能
*   **Word/Markdown 匯入**：支援 `.docx` 解析與 Markdown 編輯。
*   **AI 兩階段處理**：先進行內容增強（標記重點、建議圖片），再進行結構化（轉為 JSON）。
*   **即時預覽**：所見即所得 (WYSIWYG) 的 A4 分頁預覽。
*   **PDF 生成**：利用瀏覽器原生列印功能生成高解析度 PDF。

---

## 2. 技術架構 (Tech Stack)

本專案採用現代前端技術棧，強調客戶端運算與流暢的互動體驗。

| 類別 | 技術/庫 | 用途說明 |
| :--- | :--- | :--- |
| **Core Framework** | React 19 | UI 建構與狀態管理 (使用 Hooks)。 |
| **Language** | TypeScript | 強型別語言，確保資料結構 (Project, ContentItem) 的安全性。 |
| **Styling** | Tailwind CSS | Utility-first CSS 框架，用於快速切版。 |
| **AI Model** | Google Gemini API | 模型版本 `gemini-2.5-flash`，用於自然語言分析與 JSON 生成。 |
| **Doc Parsing** | Mammoth.js | 將 `.docx` 轉換為 HTML (透過 CDN 載入，掛載於 `window`)。 |
| **Markdown** | Turndown | 將 HTML 轉換為 Markdown (透過 CDN 載入，掛載於 `window`)。 |
| **Storage** | LocalStorage | 瀏覽器端資料持久化，無需後端資料庫。 |

---

## 3. 核心業務邏輯詳解 (Core Workflow)

應用程式的核心運作流程分為四個主要階段：

### 3.1 階段一：輸入與解析 (Input & Parsing)
*   **位置**：`components/Editor.tsx` -> `handleFileChange`
*   **邏輯**：
    1.  使用者上傳 `.docx`。
    2.  **Mammoth.js** 將 Word 轉為 Raw HTML。
    3.  提取 HTML 中的 `<img>` 標籤，轉為 Base64 並儲存於 `project.images`，將原位置替換為佔位符文字 `[圖片已匯入: ID]`。
    4.  **Turndown** 將處理過的 HTML 轉為 Markdown，存入 `project.rawContent`。

### 3.2 階段二：AI 智慧建議 (Step 1: AI Suggestions)
*   **位置**：`services/geminiService.ts` -> `getAISuggestions`
*   **目的**：增強內容，不改變結構。
*   **Prompt 策略**：
    *   指示 AI 保持原始文字完整。
    *   **稀缺性原則**：限制重點標記數量 (10%)。
    *   插入語意標籤：`[建議:重點提示]`、`[建議:定義]`、`[建議:插入圖片]`。
*   **輸出**：帶有標籤的 Markdown 字串。

### 3.3 階段三：AI 結構化生成 (Step 2: Structured Generation)
*   **位置**：`services/geminiService.ts` -> `analyzeContent`
*   **目的**：將標籤化文本轉換為嚴格的 JSON 格式供 React 渲染。
*   **Prompt 策略**：
    *   **強制 Schema**：使用 `responseSchema` 定義 `StructuredContentItem[]`。
    *   **標籤清理**：指示 AI 移除階段二產生的標籤文字 (如 `[建議:定義]`)，將其轉化為對應的 JSON 屬性 (type: 'definition')。
    *   **目錄生成**：強制在陣列首位生成 `toc` 物件。
    *   **表格/JSON 安全**：嚴格禁止字串內換行，防止 JSON 解析錯誤。

### 3.4 階段四：渲染與 PDF 輸出 (Rendering & Output)
*   **位置**：`components/PreviewPanel.tsx` & `utils/pdfGenerator.ts`
*   **渲染邏輯**：
    *   遍歷 `structuredContent` 陣列。
    *   根據 `item.type` (如 `chapter_title`, `table`, `key_point`) 渲染對應的 Tailwind 元件。
    *   **目錄處理**：使用 `pageNumber` (如果已計算) 或 `⇲` (預設) 顯示頁碼。
*   **PDF 生成原理**：
    *   不使用 `jspdf` 或 `html2canvas` (解析度太低)。
    *   使用 **隱藏 iframe/window 技巧**：
        1.  開啟一個新視窗/iframe。
        2.  寫入預覽區的 HTML。
        3.  注入 `@media print` CSS 樣式 (強制 A4 尺寸、移除按鈕、優化表格分頁)。
        4.  呼叫 `window.print()` 觸發瀏覽器列印對話框。

---

## 4. 關鍵資料結構 (Data Structures)

定義於 `types.ts`，是理解專案的關鍵。

### 4.1 Project (專案物件)
```typescript
interface Project {
  id: string;
  name: string;
  rawContent: string;       // 階段一：原始 Markdown
  suggestedContent: string; // 階段二：AI 建議後的 Markdown
  structuredContent: StructuredContentItem[]; // 階段三：最終 JSON
  styles: GlobalStyles;     // 全域樣式設定
  images: Record<string, string>; // 圖片庫 (ID -> Base64)
}
```

### 4.2 StructuredContentItem (內容單元)
這是 Discriminated Union Type，決定了內容如何被渲染。

| Type | 說明 | 主要屬性 |
| :--- | :--- | :--- |
| `chapter_title` | H1 大標題 (通常換頁) | `content` |
| `section_title` | H2 中標題 | `content` |
| `paragraph` | 一般內文 | `content` |
| `key_point` | 重點提示 (藍色框) | `content` |
| `warning_box` | 警告事項 (紅色框) | `content` |
| `definition` | 名詞定義 (綠色框) | `term`, `definition` |
| `table` | 表格 | `headers`, `rows` |
| `image_suggestion`| 圖片佔位符 | `id`, `precedingText` |
| `toc` | 目錄 | `items: { level, text, pageNumber }[]` |

---

## 5. 目錄與頁碼計算機制

由於瀏覽器無法在列印前得知 PDF 真實頁碼，我們採用**模擬計算**方式：

1.  **觸發**：使用者點擊「計算並更新目錄頁碼」。
2.  **邏輯** (`Editor.tsx` -> `handleCalculatePageNumbers`)：
    *   假設 A4 高度為 **1123px** (96 DPI 下的標準像素高度)。
    *   抓取每個標題元素 (`h1`, `h2`, `h3`) 在預覽容器中的 `offsetTop`。
    *   計算公式：`頁碼 = Math.floor(相對高度 / 1123) + 1`。
    *   更新 `structuredContent` 中的 `toc` 物件。
3.  **限制**：此為估算值，實際列印可能因邊距設定有些微誤差，但對大多數使用者場景已足夠準確。

---

## 6. 環境變數與部署

*   **API Key**：本專案使用 `process.env.API_KEY` 注入 Google Gemini API Key。
*   **部署**：
    *   這是一個純靜態網站 (Static Site)。
    *   建置後 (`npm run build`) 可部署於 GitHub Pages, Vercel, 或 Netlify。
    *   **注意**：部署時需確保 Build Environment 包含正確的 `API_KEY` 變數。

## 7. 常見問題排除

*   **JSON 解析錯誤**：通常發生在 AI 生成了包含換行符的字串。`geminiService.ts` 中的 Prompt 已針對此進行嚴格限制 (`NO raw newlines`)。
*   **PDF 圖示消失**：這是因為列印視窗跨域存取 CSS 限制。`pdfGenerator.ts` 已設定為明確寫入 FontAwesome CDN 連結至列印視窗中。
