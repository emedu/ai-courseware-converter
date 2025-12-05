
import { StructuredContentItem } from '../types';

// 計算純文字字數 (中英混合)
export const countWords = (text: string): number => {
    if (!text) return 0;
    // 移除 Markdown 符號和 HTML 標籤
    const cleanText = text.replace(/[#*`_~\[\]\(\)<>]/g, '').trim();
    // 簡單計算：漢字算一個字，英文單詞算一個字
    let count = 0;
    const englishMatch = cleanText.match(/[a-zA-Z0-9]+/g);
    if (englishMatch) count += englishMatch.length;
    
    const chineseMatch = cleanText.match(/[\u4e00-\u9fa5]/g);
    if (chineseMatch) count += chineseMatch.length;

    return count;
};

// 計算結構化內容的字數 (用於核對)
export const getStructuredContentWordCount = (items: StructuredContentItem[]): number => {
    let totalText = '';
    items.forEach(item => {
        if ('content' in item) {
            totalText += item.content + ' ';
        } else if (item.type === 'definition') {
            totalText += item.term + ' ' + item.definition + ' ';
        } else if (item.type === 'steps_list') {
            totalText += item.steps.join(' ') + ' ';
        } else if (item.type === 'table') {
            totalText += item.headers.join(' ') + ' ';
            item.rows.forEach(row => totalText += row.join(' ') + ' ');
        }
    });
    return countWords(totalText);
};
