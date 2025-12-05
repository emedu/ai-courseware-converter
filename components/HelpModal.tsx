
import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-700 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <i className="fas fa-book-reader text-2xl"></i>
            <h2 className="text-xl font-bold">AI 教材轉換器 - 使用操作手冊</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-8 space-y-8 text-gray-700 leading-relaxed">
          
          {/* Section 1: Intro */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">歡迎使用</h3>
            <p className="mb-4">
              這是一個強大的工具，能協助您將普通的 Word 文件或文字稿，瞬間轉換為排版專業、結構清晰，且具備互動式目錄的 PDF 教材。
              只需簡單四個步驟，即可完成製作。
            </p>
          </section>

          {/* Section 2: Quick Start */}
          <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
              <i className="fas fa-rocket mr-2"></i> 快速入門流程
            </h3>
            <ol className="list-decimal list-inside space-y-2 font-medium text-gray-800">
              <li><span className="font-bold text-blue-600">匯入內容</span>：上傳 Word 檔或貼上文字。</li>
              <li><span className="font-bold text-blue-600">AI 分析</span>：讓 AI 幫您標記重點、建議圖片位置。</li>
              <li><span className="font-bold text-blue-600">生成預覽</span>：將文字轉化為排版好的 A4 頁面。</li>
              <li><span className="font-bold text-blue-600">輸出成品</span>：計算頁碼並下載 PDF。</li>
            </ol>
          </section>

          {/* Section 3: Features */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4">詳細功能操作</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-bold text-indigo-700 mb-2"><i className="fas fa-magic mr-1"></i> AI 智慧分析</h4>
                <p className="text-sm text-gray-600 mb-2">點擊「AI 智慧分析與建議」，AI 將自動執行：</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                  <li>標記核心觀念 (重點提示)</li>
                  <li>定義專業術語</li>
                  <li>建議適合插入圖片的位置</li>
                </ul>
              </div>

              <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-bold text-teal-700 mb-2"><i className="fas fa-image mr-1"></i> 圖片管理</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                  <li>點擊灰色虛線框可上傳圖片。</li>
                  <li>點擊段落間的藍色「+」可插入新圖片。</li>
                  <li>支援從電腦上傳或網址匯入。</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: TOC & PDF */}
          <section className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
             <h3 className="text-xl font-bold text-yellow-800 mb-3 flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i> 關鍵步驟：目錄與頁碼
            </h3>
            <p className="mb-3 text-gray-800">
              在下載 PDF 前，請務必點擊左下角的 <strong>「🔄 計算並更新目錄頁碼」</strong> 按鈕。
            </p>
            <p className="text-sm text-gray-600">
              因為網頁是連續的，系統需要模擬 A4 紙張高度來計算章節落點，才能讓目錄顯示正確的頁數（例如 P.5），而不只是跳轉箭頭 (⇲)。
            </p>
          </section>

           {/* Section 5: PDF Settings */}
           <section>
             <h3 className="text-xl font-bold text-gray-800 mb-3">下載設定提醒</h3>
             <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>點擊「下載 PDF」後會開啟列印視窗。</li>
                <li>請確認勾選 <strong>「背景圖形 (Background graphics)」</strong>，否則重點框顏色會消失。</li>
                <li>邊界建議設定為「無」或「預設」。</li>
             </ul>
           </section>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
