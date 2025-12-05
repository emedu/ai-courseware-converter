
import React, { useRef, useState } from 'react';
import { Project, GlobalStyles } from '../types';
import HelpModal from './HelpModal';
import { countWords, getStructuredContentWordCount } from '../utils/textUtils';

interface ControlPanelProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onDownloadPdf: () => void;
  onDownloadWord: () => void;
  onGoHome: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileStatus: 'idle' | 'reading' | 'success' | 'error';
  statusMessage: string;
  onCalculatePageNumbers: () => void;

  // Global Processing Props
  onAnalyze: () => void;
  onGenerate: () => void;
  analyzingStatus: 'idle' | 'processing' | 'success' | 'error';
  generatingStatus: 'idle' | 'processing' | 'success' | 'error';
  errorMessage: string;
}


const ControlPanel: React.FC<ControlPanelProps> = ({
  project,
  onProjectChange,
  onDownloadPdf,
  onDownloadWord,
  onGoHome,
  onFileChange,
  fileStatus,
  statusMessage,
  onCalculatePageNumbers,
  onAnalyze,
  onGenerate,
  analyzingStatus,
  generatingStatus,
  errorMessage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  const updateProjectProperty = <K extends keyof Project>(key: K, value: Project[K]) => {
    onProjectChange({ ...project, [key]: value });
  };
  
  const updateStyleProperty = <K extends keyof GlobalStyles>(key: K, value: GlobalStyles[K]) => {
    updateProjectProperty('styles', { ...project.styles, [key]: value });
  };

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  // --- Verification Logic ---
  const VerificationBadge: React.FC = () => {
      if (!project.structuredContent || project.structuredContent.length === 0) return null;

      const rawCount = countWords(project.rawContent);
      const genCount = getStructuredContentWordCount(project.structuredContent);
      const ratio = genCount / (rawCount || 1);
      const isLow = ratio < 0.7;
      
      return (
          <div className={`text-sm p-2 rounded-md flex items-center justify-between mb-4 border ${isLow ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              <div className="flex items-center">
                  <i className={`fas ${isLow ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-2`}></i>
                  <span>核對字數: 原文 {rawCount} → 生成 {genCount}</span>
              </div>
              {isLow && <span className="text-xs bg-red-200 px-1 rounded">可能有刪減</span>}
          </div>
      );
  };


  // --- UI COMPONENTS ---

  const StatusIndicator: React.FC = () => {
    if (fileStatus === 'idle') return null;

    const baseClasses = "text-sm p-3 rounded-lg my-4 text-center flex items-center justify-center shadow-sm";
    const statusInfo = {
        reading: { icon: 'fa-spinner fa-spin', color: 'bg-blue-100 text-blue-800' },
        success: { icon: 'fa-check-circle', color: 'bg-green-100 text-green-800' },
        error: { icon: 'fa-exclamation-triangle', color: 'bg-red-100 text-red-800' },
    };

    const currentStatus = statusInfo[fileStatus];

    return (
        <div className={`${baseClasses} ${currentStatus.color}`}>
            <i className={`fas ${currentStatus.icon} mr-3 text-lg`}></i>
            <span className="font-medium">{statusMessage}</span>
        </div>
    );
  };

  return (
    <div className="w-1/3 h-screen bg-white shadow-lg flex flex-col overflow-hidden">
       <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept=".docx,.txt" />
       {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
       
       {/* Header - Fixed */}
      <div className="p-4 border-b bg-gray-50 shrink-0">
        <div className="flex justify-between items-center mb-2">
            <div className="flex space-x-2">
                <button onClick={onGoHome} className="text-gray-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors" title="返回首頁">
                    <i className="fas fa-home mr-2"></i>首頁
                </button>
                <button onClick={() => setShowHelp(true)} className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors font-medium">
                    <i className="fas fa-question-circle mr-2"></i>使用說明
                </button>
            </div>
            <h1 className="text-xl font-bold text-gray-800">編輯面板</h1>
        </div>
        <div className="flex items-center gap-2">
             <input
                type="text"
                value={project.name}
                onChange={(e) => updateProjectProperty('name', e.target.value)}
                className="w-full p-1 px-2 border border-gray-300 rounded-md text-sm"
                placeholder="專案名稱"
            />
             <button
              onClick={triggerFileSelect}
              disabled={fileStatus === 'reading'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap disabled:bg-indigo-400"
              title="匯入 .docx 或 .txt"
            >
              <i className="fas fa-file-import mr-1"></i>匯入
            </button>
        </div>
        <StatusIndicator />
        
        {/* Verification Badge */}
        <VerificationBadge />
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-grow flex flex-col overflow-y-auto p-4">
            {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 flex items-start">
                    <i className="fas fa-exclamation-circle mt-1 mr-2"></i>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Step 1: AI Analysis */}
            <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-sm font-semibold text-gray-700">步驟一：原始內容 & AI 建議</label>
                    <button 
                        onClick={onAnalyze}
                        disabled={analyzingStatus === 'processing'}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                    >
                        {analyzingStatus === 'processing' ? (
                            <><i className="fas fa-spinner fa-spin mr-1"></i>分析中...</>
                        ) : (
                            <><i className="fas fa-magic mr-1"></i>AI 智慧分析與建議</>
                        )}
                    </button>
                </div>
                <textarea
                    className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm bg-gray-50"
                    value={project.suggestedContent || project.rawContent}
                    onChange={(e) => {
                        if (project.suggestedContent) {
                            updateProjectProperty('suggestedContent', e.target.value);
                        } else {
                            updateProjectProperty('rawContent', e.target.value);
                        }
                    }}
                    placeholder="在此輸入內容，或使用上方按鈕匯入檔案..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">
                   {project.suggestedContent ? '顯示 AI 建議內容 (可修改)' : '顯示原始內容'}
                </p>
            </div>

            {/* Step 2: Generation */}
            <div className="mb-6 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-semibold text-gray-700">步驟二：生成預覽</label>
                    {generatingStatus === 'success' && <span className="text-green-600 text-sm"><i className="fas fa-check mr-1"></i>已生成</span>}
                </div>
                <button
                    onClick={onGenerate}
                    disabled={generatingStatus === 'processing' || (!project.rawContent && !project.suggestedContent)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {generatingStatus === 'processing' ? (
                        <><i className="fas fa-cog fa-spin mr-2"></i>正在排版生成...</>
                    ) : (
                        <><i className="fas fa-layer-group mr-2"></i>生成精美預覽</>
                    )}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    生成後，右側畫面將更新為排版預覽。
                </p>
            </div>

             {/* Styles - Collapsible or simple section */}
            <div className="mb-6 border-t pt-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">排版設定</h3>
                <div className="space-y-3">
                     <div>
                        <label className="text-xs text-gray-500 block mb-1">主題顏色</label>
                        <div className="flex gap-2">
                            {['#004A99', '#C0392B', '#27AE60', '#8E44AD', '#D35400', '#2C3E50'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => updateStyleProperty('themeColor', color)}
                                    className={`w-6 h-6 rounded-full border-2 ${project.styles.themeColor === color ? 'border-gray-800 scale-110' : 'border-white shadow-sm'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            <input 
                                type="color" 
                                value={project.styles.themeColor}
                                onChange={(e) => updateStyleProperty('themeColor', e.target.value)}
                                className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden"
                            />
                        </div>
                    </div>
                    <div>
                         <label className="text-xs text-gray-500 block mb-1">字體風格 (標題/內文)</label>
                         <div className="flex gap-2 text-sm">
                             <button 
                                onClick={() => { updateStyleProperty('titleFontFamily', 'serif'); updateStyleProperty('bodyFontFamily', 'serif'); }}
                                className={`flex-1 py-1 border rounded ${project.styles.titleFontFamily === 'serif' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}
                             >襯線體</button>
                              <button 
                                onClick={() => { updateStyleProperty('titleFontFamily', 'sans-serif'); updateStyleProperty('bodyFontFamily', 'sans-serif'); }}
                                className={`flex-1 py-1 border rounded ${project.styles.titleFontFamily === 'sans-serif' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}
                             >黑體</button>
                         </div>
                    </div>
                </div>
            </div>
      </div>

      {/* Footer Actions - Fixed */}
      <div className="p-4 border-t bg-gray-50 shrink-0 space-y-2">
          <button
              onClick={onCalculatePageNumbers}
              disabled={project.structuredContent.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-all flex items-center justify-center shadow-sm disabled:bg-gray-300 text-sm"
          >
             <i className="fas fa-sync-alt mr-2"></i>
             計算並更新目錄頁碼
          </button>

          <div className="flex gap-2">
              <button
                  onClick={onDownloadWord}
                  className="flex-1 bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-md transition-all text-sm"
                  title="下載為 Word 文件"
              >
                  <i className="fas fa-file-word mr-2"></i>
                  下載 Word
              </button>
              <button
                  onClick={onDownloadPdf}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-md transition-all text-sm"
                  title="列印或另存為 PDF"
              >
                  <i className="fas fa-file-pdf mr-2"></i>
                  下載 PDF
              </button>
          </div>
      </div>
    </div>
  );
};

export default ControlPanel;
