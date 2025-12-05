
import React, { useState, useEffect, useRef } from 'react';
import { StructuredContentItem, GlobalStyles } from '../types';
import ImagePlaceholder from './ImagePlaceholder';

interface PreviewPanelProps {
  content: StructuredContentItem[];
  styles: GlobalStyles;
  images: Record<string, string>;
  onImageUpload: (id: string, base64: string) => void;
  onImageDelete: (id: string) => void;
  onInsertImage: (index: number) => void;
  onContentUpdate: (index: number, newContent: string, field?: 'content' | 'term' | 'definition') => void;
  onTypeUpdate: (index: number, newType: StructuredContentItem['type']) => void;
  onImageSizeUpdate?: (id: string, width: string) => void;
  onFontSizeUpdate?: (index: number, change: 'increase' | 'decrease') => void;
  onInsertPageBreak?: (index: number) => void;
}

// --- Block Type Switcher Component ---
interface BlockTypeSwitcherProps {
    onSwitch: (type: StructuredContentItem['type']) => void;
    currentType: StructuredContentItem['type'];
    onFontSizeChange?: (change: 'increase' | 'decrease') => void;
    onPageBreak?: () => void;
}

const BlockTypeSwitcher: React.FC<BlockTypeSwitcherProps> = ({ 
    onSwitch, 
    currentType,
    onFontSizeChange,
    onPageBreak
}) => {
    const buttons = [
        { type: 'paragraph', icon: 'fa-paragraph', label: '內文', color: 'text-gray-600' },
        { type: 'chapter_title', icon: 'fa-heading', label: '大標題 H1', color: 'text-gray-800' },
        { type: 'section_title', icon: 'fa-heading', label: '中標題 H2', color: 'text-gray-700' },
        { type: 'key_point', icon: 'fa-star', label: '重點提示', color: 'text-blue-500' },
        { type: 'warning_box', icon: 'fa-exclamation-triangle', label: '警告事項', color: 'text-red-500' },
        { type: 'definition', icon: 'fa-book', label: '定義', color: 'text-green-600' },
    ];

    return (
        <div className="absolute -left-12 top-0 h-full flex flex-col items-end opacity-0 group-hover/block:opacity-100 transition-opacity z-20 pointer-events-none">
            <div className="bg-white border border-gray-200 shadow-md rounded-md p-1 flex flex-col gap-1 mt-1 pointer-events-auto">
                {buttons.map((btn) => (
                    <button
                        key={btn.type}
                        onClick={(e) => { e.stopPropagation(); onSwitch(btn.type as any); }}
                        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${btn.color} ${currentType === btn.type ? 'bg-gray-100 ring-1 ring-gray-300' : ''}`}
                        title={`轉換為: ${btn.label}`}
                    >
                        <i className={`fas ${btn.icon} text-xs`}></i>
                    </button>
                ))}
                
                {/* Separator */}
                <div className="h-px bg-gray-200 my-0.5"></div>
                
                {/* Font Size Controls */}
                <button
                    onClick={(e) => { e.stopPropagation(); onFontSizeChange?.('increase'); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-700"
                    title="放大字體"
                >
                    <i className="fas fa-font text-xs scale-110"></i><span className="text-[10px] absolute ml-3 -mt-2">+</span>
                </button>
                 <button
                    onClick={(e) => { e.stopPropagation(); onFontSizeChange?.('decrease'); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-700"
                    title="縮小字體"
                >
                    <i className="fas fa-font text-xs scale-75"></i><span className="text-[10px] absolute ml-3 -mt-2">-</span>
                </button>

                 {/* Separator */}
                <div className="h-px bg-gray-200 my-0.5"></div>

                {/* Page Break */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPageBreak?.(); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-purple-600"
                    title="在此處插入分頁"
                >
                    <i className="fas fa-cut text-xs"></i>
                </button>
            </div>
        </div>
    );
};


// --- Editable Block Component ---
interface EditableBlockProps {
  tagName?: string;
  htmlContent: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  onSave: (val: string) => void;
  placeholder?: string;
}

const EditableBlock: React.FC<EditableBlockProps> = ({ 
    tagName = 'div', 
    htmlContent, 
    className, 
    style, 
    id, 
    onSave,
    placeholder 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(htmlContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync external changes (e.g. re-render from prop change)
    useEffect(() => {
        setValue(htmlContent);
    }, [htmlContent]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (value !== htmlContent) {
            onSave(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
            textareaRef.current?.blur();
        }
    };

    // Adjust textarea height automatically
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            textareaRef.current.focus();
        }
    }, [isEditing]);

    const commonStyle = { ...style, whiteSpace: 'pre-wrap' as const }; // Force pre-wrap

    if (isEditing) {
        return (
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-yellow-50 outline-none resize-none overflow-hidden border border-blue-300 rounded p-1 ${className || ''}`}
                style={{ ...commonStyle, minHeight: '1.5em', display: 'block' }}
                placeholder={placeholder}
            />
        );
    }

    // Dynamic tag rendering
    const Tag = tagName as React.ElementType;

    return (
        <Tag
            id={id}
            className={`cursor-text hover:ring-2 hover:ring-blue-100 hover:rounded px-1 transition-shadow -mx-1 ${className || ''}`}
            style={commonStyle}
            onClick={handleClick}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            title="點擊編輯內容"
        />
    );
};


const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
    content, 
    styles, 
    images, 
    onImageUpload, 
    onImageDelete, 
    onInsertImage, 
    onContentUpdate,
    onTypeUpdate,
    onImageSizeUpdate,
    onFontSizeUpdate,
    onInsertPageBreak
}) => {
  const mainTitleFontSize = styles.mainTitleFontSize || 32;
  const subTitleFontSize = styles.subTitleFontSize || 24;
  const bodyFontSize = styles.bodyFontSize || 16;

  const serifFontStack = `'Noto Serif TC', 'Source Han Serif TC', 'Songti TC', Georgia, serif`;
  const sansSerifFontStack = `'Noto Sans TC', 'PingFang TC', 'Helvetica Neue', 'Microsoft JhengHei', 'Heiti TC', sans-serif`;
  
  const titleFontFamily = styles.titleFontFamily === 'serif' ? serifFontStack : sansSerifFontStack;
  const bodyFontFamily = styles.bodyFontFamily === 'serif' ? serifFontStack : sansSerifFontStack;

  const renderContentItem = (item: StructuredContentItem, index: number) => {
    const itemId = `section-${index}`;
    const saveContent = (newVal: string) => onContentUpdate(index, newVal, 'content');

    // Helper to get effective font size
    const getFontSize = (defaultSize: number) => {
        return (item as any).customFontSize ? `${(item as any).customFontSize}px` : `${defaultSize}px`;
    };

    switch (item.type) {
      case 'toc': return null;
      case 'page_break':
          return (
              <div key={index} className="visual-page-break w-full h-8 bg-gray-100 border-y border-dashed border-gray-400 text-center text-gray-500 text-xs flex items-center justify-center my-6 select-none group-hover/block:bg-gray-200 transition-colors">
                  <span>--- 分頁符號 (列印時強制換頁) ---</span>
                  <button 
                    onClick={() => onTypeUpdate(index, 'paragraph' as any)} // Hacky way to remove, better to have explicit delete, but switching to paragraph effectively 'removes' the break logic
                    className="ml-4 text-red-500 hover:text-red-700" title="移除分頁"
                  >
                      <i className="fas fa-trash-alt"></i>
                  </button>
              </div>
          );

      case 'chapter_title': // H1
        return (
          <EditableBlock 
             key={index} id={itemId} tagName="h1" htmlContent={item.content} onSave={saveContent}
             style={{ color: styles.themeColor, borderColor: styles.themeColor, pageBreakAfter: 'avoid', fontSize: getFontSize(mainTitleFontSize), fontFamily: titleFontFamily }} 
             className="font-bold mt-12 mb-8 pb-3 border-b-4"
          />
        );
      
      case 'section_title': // H2
        return (
          <EditableBlock 
             key={index} id={itemId} tagName="h2" htmlContent={item.content} onSave={saveContent}
             style={{ color: styles.themeColor, borderColor: styles.themeColor, pageBreakAfter: 'avoid', fontSize: getFontSize(subTitleFontSize), fontFamily: titleFontFamily }} 
             className="font-semibold mt-10 mb-6 border-l-4 pl-4"
          />
        );

      case 'subsection_title': // H3
        return (
           <EditableBlock 
             key={index} id={itemId} tagName="h3" htmlContent={item.content} onSave={saveContent}
             style={{ fontSize: getFontSize(subTitleFontSize * 0.85), pageBreakAfter: 'avoid', fontFamily: titleFontFamily }} 
             className="font-semibold mt-8 mb-4 text-gray-800"
           />
        );
      
      case 'paragraph':
        return <EditableBlock 
            key={index} tagName="p" htmlContent={item.content} onSave={saveContent}
            style={{ fontSize: getFontSize(bodyFontSize), fontFamily: bodyFontFamily }} 
            className="mb-4 text-gray-700 leading-normal text-justify"
        />;
      
      case 'key_point':
        if (item.content) {
            return (
                <div key={index} className="p-6 my-6 bg-blue-50 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-start" style={{ pageBreakInside: 'avoid' }}>
                    <i className="fas fa-star fa-fw mr-4 text-blue-500 mt-1" style={{ fontSize: `${parseFloat(getFontSize(bodyFontSize)) * 1.1}px` }}></i>
                    <div style={{ fontSize: getFontSize(bodyFontSize), fontFamily: bodyFontFamily }} className="flex-1 text-blue-900 leading-relaxed">
                        <EditableBlock tagName="div" htmlContent={item.content} onSave={saveContent} />
                    </div>
                </div>
            );
        }
        return null;

      case 'warning_box':
        if (item.content) {
            return (
                <div key={index} className="p-6 my-6 bg-red-50 rounded-lg shadow-sm border-l-4 border-red-500 flex items-start" style={{ pageBreakInside: 'avoid' }}>
                    <i className="fas fa-exclamation-triangle fa-fw mr-4 text-red-500 mt-1" style={{ fontSize: `${parseFloat(getFontSize(bodyFontSize)) * 1.1}px` }}></i>
                    <div style={{ fontSize: getFontSize(bodyFontSize), fontFamily: bodyFontFamily }} className="flex-1 text-red-900 leading-relaxed">
                         <EditableBlock tagName="div" htmlContent={item.content} onSave={saveContent} />
                    </div>
                </div>
            );
        }
        return null;

      case 'case_study':
        if (item.content) {
            return (
                <div key={index} className="p-6 my-6 bg-gray-100 rounded-lg border border-gray-200 flex items-start" style={{ pageBreakInside: 'avoid' }}>
                    <i className="fas fa-book-open fa-fw mr-4 text-gray-500 mt-1" style={{ fontSize: `${parseFloat(getFontSize(bodyFontSize)) * 1.1}px` }}></i>
                    <div style={{ fontSize: getFontSize(bodyFontSize), fontFamily: bodyFontFamily }} className="flex-1 text-gray-700 leading-relaxed italic">
                         <EditableBlock tagName="div" htmlContent={item.content} onSave={saveContent} />
                    </div>
                </div>
            );
        }
        return null;

      case 'definition':
        if (item.term && item.definition) {
            return (
                <div key={index} className="p-5 my-6 bg-green-50 rounded-lg border-l-4 border-green-500" style={{ pageBreakInside: 'avoid' }}>
                    <p style={{ fontSize: getFontSize(bodyFontSize), fontFamily: bodyFontFamily }} className="text-green-900 leading-relaxed flex flex-col md:flex-row md:items-start">
                        <div className="mr-2 font-bold text-green-800 shrink-0">
                             <EditableBlock 
                                tagName="span" 
                                htmlContent={item.term} 
                                onSave={(v) => onContentUpdate(index, v, 'term')} 
                                className="inline-block border-b border-dashed border-green-400"
                             />:
                        </div>
                        <div className="flex-1">
                             <EditableBlock 
                                tagName="span" 
                                htmlContent={item.definition} 
                                onSave={(v) => onContentUpdate(index, v, 'definition')} 
                             />
                        </div>
                    </p>
                </div>
            );
        }
        return null;

      case 'steps_list':
        return (
            <div key={index} className="my-6" style={{ pageBreakInside: 'avoid' }}>
                <ol style={{ fontSize: getFontSize(bodyFontSize), fontFamily: bodyFontFamily }} className="list-decimal list-inside space-y-3 pl-2 text-gray-700 leading-relaxed">
                    {item.steps.map((step, i) => <li key={i} className="pl-2" dangerouslySetInnerHTML={{ __html: step }}></li>)}
                </ol>
            </div>
        );
      case 'table':
        return (
            <div key={index} className="my-8 overflow-x-auto" style={{ pageBreakInside: 'avoid' }}>
                <table style={{ fontSize: `${parseFloat(getFontSize(bodyFontSize)) * 0.9}px` }} className="w-full border-collapse border border-gray-300 shadow-sm">
                    <thead style={{ fontFamily: titleFontFamily }}>
                        <tr style={{ backgroundColor: styles.themeColor }}>
                            {item.headers.map((header, i) => (
                                <th key={i} className="p-4 border border-gray-300 font-bold text-white text-left tracking-wide" dangerouslySetInnerHTML={{ __html: header }}></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody style={{ fontFamily: bodyFontFamily }}>
                        {item.rows.map((row, i) => (
                            <tr key={i} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className="p-4 border border-gray-300 text-gray-700 align-top" dangerouslySetInnerHTML={{ __html: cell }}></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
      case 'form_field':
         return (
            <div key={index} className="flex items-end my-6" style={{ fontFamily: bodyFontFamily }}>
                <label style={{ fontSize: getFontSize(bodyFontSize) }} className="mr-3 text-gray-800 font-medium whitespace-nowrap">{item.label}</label>
                <div className="flex-grow border-b border-gray-400 border-dashed h-6"></div>
            </div>
         );
      case 'checkbox_group':
        return (
            <div key={index} className="my-6 p-4 border border-gray-200 rounded-md bg-gray-50" style={{ fontFamily: bodyFontFamily, pageBreakInside: 'avoid' }}>
                <p style={{ fontSize: getFontSize(bodyFontSize) }} className="mb-4 text-gray-800 font-medium">{item.label}</p>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                    {item.options.map((opt, i) => (
                        <div key={i} className="flex items-center">
                            <span className="w-5 h-5 border-2 border-gray-400 rounded-sm bg-white inline-block mr-3 shadow-inner"></span>
                            <span style={{ fontSize: getFontSize(bodyFontSize) }} className="text-gray-700">{opt}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'image_suggestion':
        // Image width handling
        const imageWidth = (item as any).width || '100%';
        
        return (
          <div style={{ width: imageWidth, margin: '0 auto' }}>
            <ImagePlaceholder
                key={item.id}
                id={item.id}
                imageData={images[item.id]}
                onImageUpload={onImageUpload}
                onImageDelete={onImageDelete}
                width={imageWidth}
                onSizeChange={(newWidth) => onImageSizeUpdate && onImageSizeUpdate(item.id, newWidth)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // --- TOC Generation ---
  const tocHeaders = content.map((item, index) => {
      if (['chapter_title', 'section_title', 'subsection_title'].includes(item.type)) {
          let level = 1;
          if (item.type === 'section_title') level = 2;
          if (item.type === 'subsection_title') level = 3;
          
          return {
              text: item.content,
              level: level,
              globalIndex: index,
              pageNumber: (item as any).pageNumber
          };
      }
      return null;
  }).filter(item => item !== null);


  return (
    <div className="w-2/3 h-screen overflow-y-auto bg-gray-200 p-8">
       <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@400;700&display=swap');
          .page-container {
            min-height: 29.7cm;
          }
          
          @media print {
              /* Hide interactive elements */
              button { display: none !important; }
              .image-placeholder-empty { border: 1px solid #ddd !important; border-style: solid !important; color: transparent !important; }
              .image-placeholder-empty i, .image-placeholder-empty p { display: none !important; }
              /* Hide editing borders */
              textarea { display: none !important; }
              *[contenteditable="true"] { border: none !important; }
              /* Force background graphics */
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>
      <div id="pdf-preview-area">
        <div 
           className="page-container bg-white shadow-lg mx-auto p-[2cm] w-[21cm]">
             {content.length > 0 ? (
                <>
                    {/* Render Dynamic Global TOC at the Top */}
                    {tocHeaders.length > 0 && (
                        <div className="mb-12 bg-white" style={{ pageBreakAfter: 'always' }}>
                             <h2 style={{ fontSize: `${mainTitleFontSize}px`, fontFamily: titleFontFamily, color: styles.themeColor }} className="font-bold mb-6 text-center border-b-2 border-gray-200 pb-4 tracking-widest">目錄</h2>
                             <ul className="space-y-2">
                               {tocHeaders.map((tocItem, i) => {
                                 if (!tocItem) return null;
                                 const linkHref = `#section-${tocItem.globalIndex}`;

                                 return (
                                     <li key={i} className="toc-entry w-full" style={{ 
                                         paddingLeft: `${(tocItem.level - 1) * 20}px`, 
                                         fontFamily: bodyFontFamily,
                                     }}>
                                        <a href={linkHref} className="flex items-end w-full text-gray-800 hover:text-blue-600 no-underline group leading-none">
                                           <span 
                                             style={{ fontSize: `${bodyFontSize}px`, fontWeight: tocItem.level === 1 ? 'bold' : 'normal' }}
                                             className="bg-white pr-2 z-10" 
                                             dangerouslySetInnerHTML={{ __html: tocItem.text }}
                                           ></span>
                                           <span className="flex-grow border-b-2 border-dotted border-gray-400 mb-1 mx-1 opacity-50 group-hover:opacity-100 group-hover:border-blue-400 transition-all"></span>
                                           <span className="bg-white pl-2 text-sm font-medium text-gray-600 group-hover:text-blue-600 mb-0.5 min-w-[1.5rem] text-right" title="前往章節">
                                              {tocItem.pageNumber ? tocItem.pageNumber : '⇲'}
                                           </span>
                                        </a>
                                     </li>
                                 );
                               })}
                             </ul>
                             <div className="text-center mt-4 text-gray-400 text-xs italic">目錄由系統自動生成。請點擊「計算並更新目錄頁碼」以顯示頁數。</div>
                        </div>
                    )}

                    {/* Render All Content Linearly */}
                    {content.map((item, index) => {
                       const isImage = item.type === 'image_suggestion';
                       const isToc = item.type === 'toc';
                       const isPageBreak = item.type === 'page_break';

                       if (isToc) return null;
                       
                       // Block Type Switcher logic: Don't show on page breaks themselves (they have their own delete button)
                       const showSwitcher = !isImage && !isPageBreak;

                       return (
                           <div key={`main-${index}`} className="relative group/block py-1 pl-8">
                               {showSwitcher && (
                                   <BlockTypeSwitcher 
                                      onSwitch={(newType) => onTypeUpdate(index, newType)} 
                                      currentType={item.type} 
                                      onFontSizeChange={(change) => onFontSizeUpdate && onFontSizeUpdate(index, change)}
                                      onPageBreak={() => onInsertPageBreak && onInsertPageBreak(index)}
                                   />
                               )}
                               
                               {renderContentItem(item, index)}
                               
                               {!isImage && !isPageBreak && (
                                   <button
                                       onClick={() => onInsertImage(index)}
                                       className="absolute z-10 -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-all transform scale-75 opacity-0 group-hover/block:scale-100 group-hover/block:opacity-100 hover:bg-blue-600"
                                       title="在此處插入圖片"
                                       aria-label="在此處插入圖片"
                                   >
                                       <i className="fas fa-plus text-xs"></i>
                                   </button>
                               )}
                           </div>
                       )
                    })}
                </>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500" style={{fontFamily: sansSerifFontStack}}>
                    <i className="fas fa-file-alt text-8xl mb-6 text-gray-300"></i>
                    <p className="text-2xl font-semibold mb-2">預覽區域</p>
                    <p className="text-center text-gray-400">
                        請在左側面板匯入您的內容，<br/>系統將會在此生成精美預覽。
                    </p>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
