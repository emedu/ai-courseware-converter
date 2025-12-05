
import React from 'react';
import { Project } from '../types';

interface WelcomeScreenProps {
  onStartNew: () => void;
  onSelectProject: (id: string) => void;
  projects: Project[];
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartNew, onSelectProject, projects }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-2">AI 教材轉換器</h1>
        <p className="text-xl text-gray-600 mb-8">
          將您的文字內容，透過 AI 智慧轉換為專業精美的 PDF 教材。
        </p>
        <button
          onClick={onStartNew}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg"
        >
          <i className="fas fa-plus-circle mr-2"></i>
          開始新專案
        </button>

        {projects.length > 0 && (
          <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">或載入最近的專案</h2>
            <ul className="space-y-3 text-left">
              {projects.map(project => (
                <li key={project.id}>
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-200 rounded-md transition-colors text-blue-800 font-medium"
                  >
                    <i className="fas fa-file-alt mr-3 text-gray-500"></i>
                    {project.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
