/**
 * ProjectSelector Component
 * Dropdown to select a project for task assignment
 */

import { useState, useEffect } from 'react';
import { projectService } from '../../services/firebase/project.service';
import type { Project, ProjectMode } from '../../types/project';

interface ProjectSelectorProps {
    userId: string;
    mode: ProjectMode;
    selectedProjectId?: string;
    onProjectChange: (projectId: string | undefined) => void;
    disabled?: boolean;
    hideWhenInProject?: boolean; // Hide selector when viewing a specific project
    currentProjectId?: string; // Current project context (for auto-select)
    className?: string;
}

export default function ProjectSelector({
    userId,
    mode,
    selectedProjectId,
    onProjectChange,
    disabled = false,
    hideWhenInProject = false,
    currentProjectId,
    className = '',
}: ProjectSelectorProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!userId) return;

        // Subscribe to projects for this mode
        const unsubscribe = projectService.subscribeToProjects(
            userId,
            (projectList) => {
                setProjects(projectList);
                setLoading(false);

                // Auto-select Inbox if no project selected and we have projects
                if (!selectedProjectId && projectList.length > 0) {
                    const inbox = projectList.find(p => p.isDefault);
                    if (inbox) {
                        onProjectChange(inbox.id);
                    }
                }
            },
            { filters: { mode, isArchived: false } }
        );

        return () => unsubscribe();
    }, [userId, mode]);

    // If in project context, auto-select that project and hide
    useEffect(() => {
        if (currentProjectId && hideWhenInProject) {
            onProjectChange(currentProjectId);
        }
    }, [currentProjectId, hideWhenInProject]);

    // Hide if we're viewing a specific project
    if (hideWhenInProject && currentProjectId) {
        const currentProject = projects.find(p => p.id === currentProjectId);
        if (currentProject) {
            return (
                <div className={`project-selector-preview ${className}`}>
                    <span className="project-icon">{currentProject.icon}</span>
                    <span className="project-name">{currentProject.name}</span>
                </div>
            );
        }
        return null;
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    if (loading) {
        return (
            <div className={`project-selector loading ${className}`}>
                <span className="loading-text">Loading projects...</span>
            </div>
        );
    }

    return (
        <div className={`project-selector ${className}`}>
            <button
                type="button"
                className="project-selector-button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                title="Select project"
            >
                <span className="project-icon">
                    {selectedProject?.icon || '📁'}
                </span>
                <span className="project-name">
                    {selectedProject?.name || 'Select Project'}
                </span>
                <svg
                    className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                >
                    <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
                    <div className="project-dropdown">
                        {projects.map(project => (
                            <button
                                key={project.id}
                                type="button"
                                className={`project-option ${project.id === selectedProjectId ? 'selected' : ''}`}
                                onClick={() => {
                                    onProjectChange(project.id);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="project-icon">{project.icon}</span>
                                <span className="project-name">{project.name}</span>
                                {project.isDefault && (
                                    <span className="default-badge">Default</span>
                                )}
                                <span className="task-count">{project.taskCount}</span>
                            </button>
                        ))}

                        {projects.length === 0 && (
                            <div className="no-projects">
                                No projects found
                            </div>
                        )}
                    </div>
                </>
            )}

            <style>{`
        .project-selector {
          position: relative;
          display: inline-flex;
        }

        .project-selector-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          transition: all 0.15s ease;
        }

        .project-selector-button:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .project-selector-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .project-icon {
          font-size: 14px;
        }

        .dropdown-arrow {
          margin-left: 4px;
          transition: transform 0.2s ease;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
        }

        .project-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          min-width: 200px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 51;
          max-height: 300px;
          overflow-y: auto;
        }

        .project-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          text-align: left;
          transition: background 0.1s ease;
        }

        .project-option:hover {
          background: #f3f4f6;
        }

        .project-option.selected {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .project-option .project-name {
          flex: 1;
        }

        .default-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: #e5e7eb;
          border-radius: 4px;
          color: #6b7280;
        }

        .task-count {
          font-size: 11px;
          color: #9ca3af;
          padding: 2px 6px;
          background: #f3f4f6;
          border-radius: 4px;
        }

        .project-selector-preview {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .loading {
          padding: 6px 10px;
          color: #9ca3af;
          font-size: 12px;
        }

        .no-projects {
          padding: 16px;
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
        }
      `}</style>
        </div>
    );
}
