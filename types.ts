
export interface Project {
  id: string;
  name: string;
  rawContent: string; 
  suggestedContent: string; 
  structuredContent: StructuredContentItem[]; 
  styles: GlobalStyles;
  images: Record<string, string>; // key: image id, value: base64 string
}

export interface GlobalStyles {
  themeColor: string;
  titleFontFamily: 'serif' | 'sans-serif';
  bodyFontFamily: 'serif' | 'sans-serif';
  mainTitleFontSize: number; // 大標題 (H1)
  subTitleFontSize: number;  // 副標題 (H2, H3)
  bodyFontSize: number;      // 內文
  headerText: string;
  footerText: string;
}

export type StructuredContentItem =
  | { type: 'chapter_title'; content: string; pageNumber?: number; customFontSize?: number }      // H1
  | { type: 'section_title'; content: string; pageNumber?: number; customFontSize?: number }      // H2
  | { type: 'subsection_title'; content: string; pageNumber?: number; customFontSize?: number }  // H3
  | { type: 'paragraph'; content: string; customFontSize?: number }
  | { type: 'image_suggestion'; id: string; precedingText: string; width?: string }
  | { type: 'key_point'; content: string; customFontSize?: number }
  | { type: 'warning_box'; content: string; customFontSize?: number }
  | { type: 'case_study'; content: string; customFontSize?: number }
  | { type: 'definition'; term: string; definition: string; customFontSize?: number }
  | { type: 'steps_list'; steps: string[]; customFontSize?: number }
  | { type: 'table'; headers: string[]; rows: string[][]; customFontSize?: number }
  | { type: 'form_field'; label: string; customFontSize?: number }
  | { type: 'checkbox_group'; label: string; options: string[]; customFontSize?: number }
  | { type: 'page_break' } // New type for manual page breaks
  | { type: 'toc'; items: { level: number; text: string; pageNumber?: number }[] }; // Legacy TOC type
