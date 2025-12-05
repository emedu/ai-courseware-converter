
import React, { useState, useEffect, useMemo } from 'react';
import { Project, StructuredContentItem } from '../types';
import { getAISuggestions, analyzeContent } from '../services/geminiService';
import ControlPanel from './ControlPanel';
import PreviewPanel from './PreviewPanel';
import { openPrintableView } from '../utils/pdfGenerator';
import { generateWordDocument } from '../utils/wordGenerator';

// Removed 'declare const' to avoid syntax errors. 
// Libraries are loaded via script tags in index.html and accessed via window.

interface EditorProps {
  project: Project;
  onGoHome: () => void;
  onProjectChange: (project: Project) => void;
}

type FileStatus = 'idle' | 'reading' | 'success' | 'error';
type ProcessStatus = 'idle' | 'processing' | 'success' | 'error';

const Editor: React.FC<EditorProps> = ({ project, onGoHome, onProjectChange }) => {
  const [currentProject, setCurrentProject] = useState(project);

  const [fileStatus, setFileStatus] = useState<FileStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [analyzingStatus, setAnalyzingStatus] = useState<ProcessStatus>('idle');
  const [generatingStatus, setGeneratingStatus] = useState<ProcessStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 優化的自動儲存機制
  // 使用 useMemo 計算專案的 hash，只在內容真正改變時才觸發儲存
  const projectHash = useMemo(() => {
    // 只監控重要的變更，忽略臨時狀態
    return JSON.stringify({
      name: currentProject.name,
      rawContent: currentProject.rawContent,
      suggestedContent: currentProject.suggestedContent,
      structuredContent: currentProject.structuredContent,
      styles: currentProject.styles,
      images: currentProject.images
    });
  }, [currentProject]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onProjectChange(currentProject);
    }, 500); // Debounce save
    return () => clearTimeout(handler);
  }, [projectHash, onProjectChange]); // 使用 hash 而非整個 project

  const updateProjectState = <K extends keyof Project>(key: K, value: Project[K]) => {
    setCurrentProject(prev => ({ ...prev, [key]: value }));
  };

  // --- CONTENT EDITING (WYSIWYG) ---
  const handleContentUpdate = (index: number, newContent: string, field: 'content' | 'term' | 'definition' = 'content') => {
    const newStructuredContent = [...currentProject.structuredContent];
    if (!newStructuredContent[index]) return;

    const targetItem = { ...newStructuredContent[index] };

    if (field === 'content' && 'content' in targetItem) {
      (targetItem as any).content = newContent;
    } else if (field === 'term' && targetItem.type === 'definition') {
      targetItem.term = newContent;
    } else if (field === 'definition' && targetItem.type === 'definition') {
      targetItem.definition = newContent;
    }

    newStructuredContent[index] = targetItem;
    updateProjectState('structuredContent', newStructuredContent);
  };

  const handleImageSizeUpdate = (id: string, width: string) => {
    const newStructuredContent = currentProject.structuredContent.map(item => {
      if (item.type === 'image_suggestion' && item.id === id) {
        return { ...item, width };
      }
      return item;
    });
    updateProjectState('structuredContent', newStructuredContent);
  };

  // Handle individual font size adjustment
  const handleFontSizeUpdate = (index: number, change: 'increase' | 'decrease') => {
    const newStructuredContent = [...currentProject.structuredContent];
    const item = newStructuredContent[index];
    if (!item || item.type === 'image_suggestion' || item.type === 'page_break' || item.type === 'toc') return;

    // Determine current size or default
    let currentSize = (item as any).customFontSize;
    if (!currentSize) {
      // If no custom size, check global styles to determine starting point
      const styles = currentProject.styles;
      switch (item.type) {
        case 'chapter_title': currentSize = styles.mainTitleFontSize; break;
        case 'section_title': currentSize = styles.subTitleFontSize; break;
        case 'subsection_title': currentSize = styles.subTitleFontSize * 0.85; break;
        default: currentSize = styles.bodyFontSize;
      }
    }

    const step = 2; // Change by 2px
    const newSize = change === 'increase' ? currentSize + step : Math.max(8, currentSize - step);

    (newStructuredContent[index] as any).customFontSize = newSize;
    updateProjectState('structuredContent', newStructuredContent);
  };

  // Handle inserting a manual page break
  const handleInsertPageBreak = (index: number) => {
    const newStructuredContent = [...currentProject.structuredContent];
    // Insert page break before the current item
    newStructuredContent.splice(index, 0, { type: 'page_break' });
    updateProjectState('structuredContent', newStructuredContent);
  };


  // --- BLOCK TYPE SWITCHING ---
  const handleTypeUpdate = (index: number, newType: StructuredContentItem['type']) => {
    const newStructuredContent = [...currentProject.structuredContent];
    const oldItem = newStructuredContent[index];
    if (!oldItem) return;

    // Extract text content from the old item to preserve it
    let contentText = '';
    if ('content' in oldItem) {
      contentText = oldItem.content;
    } else if (oldItem.type === 'definition') {
      contentText = `${oldItem.term}: ${oldItem.definition}`;
    } else if (oldItem.type === 'steps_list') {
      contentText = oldItem.steps.join('\n');
    }

    // Create new item based on the requested type
    let newItem: StructuredContentItem;

    switch (newType) {
      case 'chapter_title':
      case 'section_title':
      case 'subsection_title':
      case 'paragraph':
      case 'key_point':
      case 'warning_box':
      case 'case_study':
        newItem = { type: newType, content: contentText } as any;
        break;
      case 'definition':
        newItem = {
          type: 'definition',
          term: '術語',
          definition: contentText
        };
        break;
      default:
        // For complex types not supported by simple switching, do nothing or reset
        return;
    }

    // Preserve custom font size if existed
    if ('customFontSize' in oldItem) {
      (newItem as any).customFontSize = (oldItem as any).customFontSize;
    }

    newStructuredContent[index] = newItem;
    updateProjectState('structuredContent', newStructuredContent);
  };

  // --- GLOBAL ACTIONS ---

  const handleAnalyze = async () => {
    if (!currentProject.rawContent) return;
    setAnalyzingStatus('processing');
    setErrorMessage('');

    try {
      const result = await getAISuggestions(currentProject.rawContent);
      updateProjectState('suggestedContent', result);
      setAnalyzingStatus('success');
    } catch (err: any) {
      setAnalyzingStatus('error');
      setErrorMessage(err.message || "AI 分析失敗");
    }
  };

  const handleGenerate = async () => {
    const contentToAnalyze = currentProject.suggestedContent || currentProject.rawContent;
    if (!contentToAnalyze) return;

    setGeneratingStatus('processing');
    setErrorMessage('');

    try {
      const result = await analyzeContent(contentToAnalyze);
      updateProjectState('structuredContent', result);
      setGeneratingStatus('success');
    } catch (err: any) {
      setGeneratingStatus('error');
      setErrorMessage(err.message || "生成失敗");
    }
  };

  const handleCalculatePageNumbers = () => {
    const previewArea = document.getElementById('pdf-preview-area');
    if (!previewArea) return;

    const pageContainer = previewArea.querySelector('.page-container');
    if (!pageContainer) return;

    const A4_HEIGHT_PX = 1123;
    let updatedCount = 0;

    // Flattened logic for single document
    const newStructuredContent = currentProject.structuredContent.map((item, index) => {
      if (['chapter_title', 'section_title', 'subsection_title'].includes(item.type)) {
        const elementId = `section-${index}`;
        const element = document.getElementById(elementId);

        if (element) {
          const containerRect = pageContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          // Calculate relative top position within the container
          const relativeTop = elementRect.top - containerRect.top;
          // Formula: 1-based page number
          const pageNumber = Math.floor(relativeTop / A4_HEIGHT_PX) + 1;

          updatedCount++;
          return { ...item, pageNumber };
        }
      }
      return item;
    });

    if (updatedCount > 0) {
      updateProjectState('structuredContent', newStructuredContent);
      alert(`已更新 ${updatedCount} 個標題的頁碼！`);
    } else {
      alert("找不到可更新的標題，請確認預覽區已生成內容。");
    }
  };

  const handleImageUpload = (id: string, base64: string) => {
    const newImages = { ...currentProject.images, [id]: base64 };
    updateProjectState('images', newImages);
  };

  const handleImageDelete = (id: string) => {
    const newImages = { ...currentProject.images };
    delete newImages[id];
    updateProjectState('images', newImages);
  };

  const handleInsertImage = (afterIndex: number) => {
    const newImageSuggestion: StructuredContentItem = {
      type: 'image_suggestion',
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      precedingText: '使用者手動插入的圖片'
    };

    const newContent = [...currentProject.structuredContent];
    newContent.splice(afterIndex + 1, 0, newImageSuggestion);
    updateProjectState('structuredContent', newContent);
  };

  const handleDownloadWord = () => {
    generateWordDocument(currentProject);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileStatus('idle');
      return;
    }

    setFileStatus('reading');
    setStatusMessage('正在讀取檔案...');

    const fileName = file.name.toLowerCase();

    const showError = (message: string) => {
      setFileStatus('error');
      setStatusMessage(message);
      if (event.target) event.target.value = '';
    };

    if (fileName.endsWith('.gdoc') || fileName.endsWith('.doc')) {
      showError("不支援的格式。請先將 Google 文件或 .doc 檔案另存為 .docx 格式後再上傳。");
      return;
    }

    // --- TXT File Handling ---
    if (fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          updateProjectState('rawContent', text);
          // Reset suggestions and structured content on new file
          updateProjectState('suggestedContent', '');
          updateProjectState('structuredContent', []);

          setFileStatus('success');
          setStatusMessage(`文字檔讀取成功！`);
        } else {
          showError("無法讀取文字檔內容。");
        }
      };
      reader.onerror = () => showError("讀取檔案時發生錯誤。");
      reader.readAsText(file, 'UTF-8');
      return;
    }

    // --- DOCX File Handling ---
    if (fileName.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer) {
          try {
            const mammoth = (window as any).mammoth;
            const TurndownService = (window as any).TurndownService;
            const turndownPluginGfm = (window as any).turndownPluginGfm;

            if (!mammoth || !TurndownService) {
              throw new Error("必要的檔案轉換程式庫載入失敗");
            }

            const convertResult = await mammoth.convertToHtml({ arrayBuffer });
            const html = convertResult.value;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const imageElements = Array.from(doc.querySelectorAll('img'));

            const newImages: Record<string, string> = {};

            imageElements.forEach(img => {
              const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              const base64Src = img.src;

              if (base64Src && base64Src.startsWith('data:image')) {
                newImages[imageId] = base64Src;
                const placeholderText = doc.createTextNode(`[圖片已匯入: ${imageId}]`);
                img.parentNode?.replaceChild(placeholderText, img);
              }
            });

            const modifiedHtml = doc.body.innerHTML;
            const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
            turndownService.use(turndownPluginGfm.gfm);
            const markdown = turndownService.turndown(modifiedHtml);

            setCurrentProject(prev => ({
              ...prev,
              rawContent: markdown,
              suggestedContent: '',
              structuredContent: [],
              images: { ...prev.images, ...newImages }
            }));

            setFileStatus('success');
            setStatusMessage(`檔案讀取成功！`);
          } catch (error) {
            console.error("Error processing DOCX file:", error);
            showError("無法讀取 Word 檔案。請確認檔案格式正確且未損壞。");
          }
        } else {
          showError("無法讀取檔案內容。");
        }
      };
      reader.onerror = () => { showError("讀取檔案時發生錯誤。"); };
      reader.readAsArrayBuffer(file);
      return;
    }

    showError("不支援的檔案格式。請上傳 .docx 或 .txt 檔案。");
  };

  const handleDownloadPdf = () => {
    const styles = currentProject.styles;
    const pageStyles = `
      @media print {
        .image-placeholder-empty {
          display: none;
        }
        .page-container {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            margin: 0 !important;
        }
        /* Table printing optimization */
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        body { zoom: 1.25; } /* Enlarge print output */
        
        /* Visual Page Break for Print */
        .visual-page-break {
            border: none !important;
            height: 0 !important;
            margin: 0 !important;
            page-break-before: always !important;
        }
        .visual-page-break::after {
            content: "" !important;
        }
      }
      @page {
        size: A4;
        margin: 2cm;
      }
      @page {
        @top-center {
          content: "${styles.headerText}";
          font-size: 0.9rem;
          color: #888;
          font-family: ${styles.bodyFontFamily === 'serif' ? `'Noto Serif TC', serif` : `'Noto Sans TC', sans-serif`};
        }
        @bottom-center {
          content: "${styles.footerText} - 第 " counter(page) " 頁";
          font-size: 0.9rem;
          color: #888;
          font-family: ${styles.bodyFontFamily === 'serif' ? `'Noto Serif TC', serif` : `'Noto Sans TC', sans-serif`};
        }
      }
      body {
        counter-reset: page;
        background-color: #FFF !important;
      }
    `;
    openPrintableView('pdf-preview-area', pageStyles);
  };


  return (
    <div className="flex h-screen bg-gray-200 font-sans">
      <ControlPanel
        project={currentProject}
        onProjectChange={setCurrentProject}
        onGoHome={onGoHome}
        onFileChange={handleFileChange}
        fileStatus={fileStatus}
        statusMessage={statusMessage}
        onCalculatePageNumbers={handleCalculatePageNumbers}
        onDownloadPdf={handleDownloadPdf}
        onDownloadWord={handleDownloadWord}

        // Global Processing Props
        onAnalyze={handleAnalyze}
        onGenerate={handleGenerate}
        analyzingStatus={analyzingStatus}
        generatingStatus={generatingStatus}
        errorMessage={errorMessage}
      />
      <PreviewPanel
        content={currentProject.structuredContent}
        styles={currentProject.styles}
        images={currentProject.images}
        onImageUpload={handleImageUpload}
        onImageDelete={handleImageDelete}
        onInsertImage={handleInsertImage}
        onContentUpdate={handleContentUpdate}
        onTypeUpdate={handleTypeUpdate}
        onImageSizeUpdate={handleImageSizeUpdate}
        onFontSizeUpdate={handleFontSizeUpdate}
        onInsertPageBreak={handleInsertPageBreak}
      />
    </div>
  );
};

export default Editor;
