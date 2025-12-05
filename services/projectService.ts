
import { Project, GlobalStyles } from '../types';

const PROJECT_LIST_KEY = 'courseware_projects_list';

const getDefaultStyles = (): GlobalStyles => ({
  themeColor: '#004A99', // Professional Business Blue
  titleFontFamily: 'serif',
  bodyFontFamily: 'sans-serif',
  mainTitleFontSize: 32,
  subTitleFontSize: 24,
  bodyFontSize: 16,
  headerText: '內部教材',
  footerText: '版權所有',
});

// Function to get the list of project IDs
export const getProjects = (): Project[] => {
  const listJSON = localStorage.getItem(PROJECT_LIST_KEY);
  if (!listJSON) {
    return [];
  }
  const projectIds = JSON.parse(listJSON) as string[];
  return projectIds.map(id => getProject(id)).filter(p => p !== null) as Project[];
};

// Function to add a project ID to the list
const addProjectToList = (projectId: string): void => {
  const listJSON = localStorage.getItem(PROJECT_LIST_KEY);
  const projectIds = listJSON ? (JSON.parse(listJSON) as string[]) : [];
  if (!projectIds.includes(projectId)) {
    projectIds.push(projectId);
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(projectIds));
  }
};

// Function to create a new project
export const createProject = (name: string): Project => {
  const defaultContent = `# 美業概論：美業成功方程式
## 學員詳盡複習教材 (A4 講義版)
### 主講人：伊美強叔

[強叔的話] 在美業的道路上，心態決定高度，觀念塑造未來。

## 開場白與課程核心
各位同學大家好，我是伊美美容教育機構的總班主任，也是大家熟悉的伊美強叔。非常歡迎大家加入我們伊美美業的創業班課程。
[課程重點釐清]
- **心態與觀念優先**: 我們今天不直接切入技術細節。技術很重要，但比技術更重要的是你的心態和觀念。
- **成功需要完整思維**: 美業成功不是單靠一項技術就能達成。你需要的是一套完整的思維方式。

[學員互動]
請拿出你的手機，掃描螢幕上的QR Code。這會連到我們的互動系統。請認真思考並回答這個問題：「我，為什麼想來學美業？」
`;

  const newProject: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: name,
    rawContent: defaultContent,
    suggestedContent: '',
    structuredContent: [],
    styles: getDefaultStyles(),
    images: {},
  };
  saveProject(newProject);
  addProjectToList(newProject.id);
  return newProject;
};

// Function to save a project with error handling
export const saveProject = (project: Project): void => {
  try {
    const projectData = JSON.stringify(project);
    const sizeInBytes = new Blob([projectData]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    // 警告：專案大小接近限制
    if (sizeInMB > 3) {
      console.warn(`⚠️ 專案「${project.name}」大小: ${sizeInMB.toFixed(2)}MB，接近 LocalStorage 限制`);
      console.warn('💡 建議：刪除舊專案或減少圖片數量');
    }

    // 嘗試儲存
    localStorage.setItem(`project_${project.id}`, projectData);

    // 成功儲存的日誌
    if (sizeInMB > 1) {
      console.log(`✅ 專案已儲存 (${sizeInMB.toFixed(2)}MB)`);
    }

  } catch (error) {
    // 捕捉容量不足錯誤
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const storageInfo = getStorageInfo();
      throw new Error(
        `💾 儲存空間不足！\n\n` +
        `目前使用: ${storageInfo.usedMB.toFixed(2)}MB / ${storageInfo.totalMB}MB (${storageInfo.percentage.toFixed(1)}%)\n\n` +
        `建議解決方法：\n` +
        `1. 刪除不需要的舊專案\n` +
        `2. 減少文件中的圖片數量\n` +
        `3. 匯出專案為檔案備份後刪除\n` +
        `4. 壓縮圖片（未來功能）`
      );
    }

    // 其他錯誤
    throw new Error(`儲存專案時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// Function to get a project by ID
export const getProject = (projectId: string): Project | null => {
  const projectJSON = localStorage.getItem(`project_${projectId}`);
  if (projectJSON) {
    const project = JSON.parse(projectJSON) as Project;
    return project;
  }
  return null;
};

// Function to get storage information
export const getStorageInfo = (): {
  usedBytes: number;
  usedMB: number;
  totalMB: number;
  percentage: number;
  projects: { id: string; name: string; sizeMB: number }[];
} => {
  let totalUsed = 0;
  const projects: { id: string; name: string; sizeMB: number }[] = [];

  // 計算所有 localStorage 使用量
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const itemSize = localStorage[key].length + key.length;
      totalUsed += itemSize;

      // 如果是專案資料，記錄詳細資訊
      if (key.startsWith('project_')) {
        try {
          const project = JSON.parse(localStorage[key]) as Project;
          const sizeMB = itemSize / (1024 * 1024);
          projects.push({
            id: project.id,
            name: project.name,
            sizeMB: sizeMB
          });
        } catch (e) {
          // 忽略解析錯誤
        }
      }
    }
  }

  const totalMB = 5; // 假設 5MB 限制（實際可能是 5-10MB）
  const usedMB = totalUsed / (1024 * 1024);

  return {
    usedBytes: totalUsed,
    usedMB: usedMB,
    totalMB: totalMB,
    percentage: (usedMB / totalMB) * 100,
    projects: projects.sort((a, b) => b.sizeMB - a.sizeMB) // 按大小排序
  };
};

// Function to delete a project
export const deleteProject = (projectId: string): void => {
  // 從 localStorage 刪除專案資料
  localStorage.removeItem(`project_${projectId}`);

  // 從專案列表中移除
  const listJSON = localStorage.getItem(PROJECT_LIST_KEY);
  if (listJSON) {
    const projectIds = JSON.parse(listJSON) as string[];
    const updatedIds = projectIds.filter(id => id !== projectId);
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(updatedIds));
  }

  console.log(`🗑️ 專案已刪除: ${projectId}`);
};
