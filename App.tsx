import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import WelcomeScreen from './components/WelcomeScreen';
import { Project } from './types';
import { getProjects, createProject as createNewProject, getProject, saveProject } from './services/projectService';

const App: React.FC = () => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadedProjects = getProjects();
    setProjects(loadedProjects);

    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const project = getProject(hash);
      if (project) {
        setActiveProject(project);
      }
    }
  }, []);
  
  const handleProjectChange = (updatedProject: Project) => {
    saveProject(updatedProject);
    // Update the project list state to reflect name changes immediately
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const startNewProject = () => {
    const newProject = createNewProject(`新專案 ${new Date().toLocaleString()}`);
    setProjects(prev => [...prev, newProject]);
    window.location.hash = newProject.id;
    setActiveProject(newProject);
  };
  
  const loadProject = (projectId: string) => {
    const project = getProject(projectId);
    if (project) {
        window.location.hash = project.id;
        setActiveProject(project);
    }
  };

  const goHome = () => {
    window.location.hash = '';
    setActiveProject(null);
    // Reload projects from storage to ensure list is up to date
    setProjects(getProjects());
  }

  const renderContent = () => {
    if (activeProject) {
      return <Editor key={activeProject.id} project={activeProject} onGoHome={goHome} onProjectChange={handleProjectChange} />;
    }
    return <WelcomeScreen onStartNew={startNewProject} onSelectProject={loadProject} projects={projects} />;
  };

  return <>{renderContent()}</>;
};

export default App;