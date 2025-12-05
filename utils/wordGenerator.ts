
import { Project, StructuredContentItem } from '../types';

export const generateWordDocument = (project: Project) => {
  const { styles, images, structuredContent } = project;

  // Helper to map font selection to actual font family string
  const getFontFamily = (type: 'serif' | 'sans-serif') => {
    return type === 'serif' 
      ? '"Times New Roman", "PMingLiU", serif' 
      : '"Arial", "Microsoft JhengHei", sans-serif';
  };

  const titleFont = getFontFamily(styles.titleFontFamily);
  const bodyFont = getFontFamily(styles.bodyFontFamily);

  let htmlBody = '';

  // Use structured content directly
  const allContent = structuredContent || [];

  // 1. Check if we need a TOC (if there are headers)
  const hasHeaders = allContent.some(item => 
    ['chapter_title', 'section_title', 'subsection_title'].includes(item.type)
  );

  // Generate Word Native TOC using Field Codes
  if (hasHeaders) {
      htmlBody += `
          <div style="margin-bottom: 40px; page-break-after: always;">
            <h1 style="font-size: ${styles.mainTitleFontSize}pt; color: ${styles.themeColor}; font-family: ${titleFont}; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">目錄</h1>
            
            <!-- MS Word Field Code for Automatic TOC -->
            <p class=MsoTOC1 style="margin-bottom: 20px;">
              <!--[if supportFields]>
                <span style='mso-element:field-begin'></span>
                TOC \\o "1-3" \\h \\z \\u
                <span style='mso-element:field-end'></span>
              <![endif]-->
            </p>

            <p style="text-align:center; color:#888; font-size:10pt; font-family: ${bodyFont}; margin-top: 50px;">
              <i>(請在此處按滑鼠右鍵，選擇「更新功能變數」以產生最新頁碼)</i>
            </p>
          </div>
          <br clear=all style='page-break-before:always'>
        `;
  }


  allContent.forEach(item => {
    // Get custom font size if available, else undefined (will fallback to default)
    const customSize = (item as any).customFontSize;
    const sizeStyle = customSize ? `font-size: ${customSize}pt;` : '';

    switch (item.type) {
      case 'toc':
        break;
      
      case 'page_break':
        htmlBody += `<br clear=all style='page-break-before:always'>`;
        break;

      case 'chapter_title':
        htmlBody += `<h1 style="${!customSize ? `font-size: ${styles.mainTitleFontSize}pt;` : sizeStyle} color: ${styles.themeColor}; font-family: ${titleFont}; page-break-before: always; margin-top: 40px; border-bottom: 3px solid ${styles.themeColor}; padding-bottom: 10px;">${item.content}</h1>`;
        break;

      case 'section_title':
        htmlBody += `<h2 style="${!customSize ? `font-size: ${styles.subTitleFontSize}pt;` : sizeStyle} color: ${styles.themeColor}; font-family: ${titleFont}; margin-top: 30px; border-left: 5px solid ${styles.themeColor}; padding-left: 10px;">${item.content}</h2>`;
        break;

      case 'subsection_title':
        htmlBody += `<h3 style="${!customSize ? `font-size: ${styles.subTitleFontSize * 0.8}pt;` : sizeStyle} color: #333; font-family: ${titleFont}; margin-top: 20px;">${item.content}</h3>`;
        break;

      case 'paragraph':
        htmlBody += `<p style="${!customSize ? `font-size: ${styles.bodyFontSize}pt;` : sizeStyle} font-family: ${bodyFont}; line-height: 1.6; text-align: justify;">${item.content}</p>`;
        break;

      case 'key_point':
        htmlBody += `
          <div style="background-color: #e6f7ff; border: 2px solid #1890ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #0050b3; font-weight: bold; margin: 0 0 5px 0; font-family: ${bodyFont};">★ 重點提示</p>
            <p style="margin: 0; font-family: ${bodyFont}; ${!customSize ? `font-size: ${styles.bodyFontSize}pt;` : sizeStyle}">${item.content}</p>
          </div>
        `;
        break;

      case 'warning_box':
        htmlBody += `
          <div style="background-color: #fff1f0; border: 2px solid #ff4d4f; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #cf1322; font-weight: bold; margin: 0 0 5px 0; font-family: ${bodyFont};">⚠️ 注意事項</p>
            <p style="margin: 0; font-family: ${bodyFont}; ${!customSize ? `font-size: ${styles.bodyFontSize}pt;` : sizeStyle}">${item.content}</p>
          </div>
        `;
        break;

      case 'definition':
        htmlBody += `
          <div style="background-color: #f6ffed; border-left: 5px solid #52c41a; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-family: ${bodyFont}; ${!customSize ? `font-size: ${styles.bodyFontSize}pt;` : sizeStyle}">
              <strong style="color: #389e0d;">${item.term}:</strong> ${item.definition}
            </p>
          </div>
        `;
        break;
      
      case 'case_study':
         htmlBody += `
          <div style="background-color: #f5f5f5; border: 1px solid #d9d9d9; padding: 15px; margin: 20px 0; font-style: italic;">
            <p style="margin: 0; font-family: ${bodyFont}; ${!customSize ? `font-size: ${styles.bodyFontSize}pt;` : sizeStyle}">
              <strong>案例分析:</strong> ${item.content}
            </p>
          </div>
        `;
        break;

      case 'image_suggestion':
        if (images[item.id]) {
          htmlBody += `
            <div style="text-align: center; margin: 20px 0;">
              <img src="${images[item.id]}" width="400" alt="Image" />
            </div>
          `;
        }
        break;

      case 'table':
        htmlBody += `
          <table border="1" style="border-collapse: collapse; width: 100%; margin: 20px 0; font-family: ${bodyFont}; font-size: ${styles.bodyFontSize * 0.9}pt;">
            <thead>
              <tr style="background-color: ${styles.themeColor}; color: white;">
                ${item.headers.map(h => `<th style="padding: 8px;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${item.rows.map(row => `
                <tr>
                  ${row.map(cell => `<td style="padding: 8px;">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
        
       case 'steps_list':
         htmlBody += `<ol style="font-family: ${bodyFont}; font-size: ${styles.bodyFontSize}pt; margin: 15px 0;">`;
         item.steps.forEach(step => {
             htmlBody += `<li style="margin-bottom: 5px;">${step}</li>`;
         });
         htmlBody += `</ol>`;
         break;
         
       case 'form_field':
         htmlBody += `<p style="font-family: ${bodyFont}; margin: 15px 0;">${item.label}: ________________________</p>`;
         break;
         
       case 'checkbox_group':
         htmlBody += `<div style="font-family: ${bodyFont}; margin: 15px 0;"><p><strong>${item.label}</strong></p>`;
         item.options.forEach(opt => {
             htmlBody += `<p>□ ${opt}</p>`;
         });
         htmlBody += `</div>`;
         break;
    }
  });

  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${project.name}</title>
      <!--[if gte mso 9]>
      <xml>
      <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        /* Basic Word Styling */
        p.MsoTOC1, li.MsoTOC1 {
            margin-bottom: 5pt;
            font-family: ${bodyFont};
            font-size: 12pt;
        }
        a { text-decoration: none; color: black; }
      </style>
    </head>
    <body style="tab-interval: 36pt">
      ${htmlBody}
    </body>
    </html>
  `;

  const blob = new Blob([fullHtml], { type: 'application/vnd.ms-word;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name || '教材'}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
