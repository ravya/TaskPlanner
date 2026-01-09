/**
 * ProjectList Component
 * Displays list of projects for the current mode
 */

import { useState, useEffect } from 'react';
import { projectService } from '../../services/firebase/project.service';
import ProjectCard from '../ProjectCard';
import AddProjectModal from '../AddProjectModal';
import DeleteProjectConfirmDialog from '../DeleteProjectConfirmDialog';
import type { Project, ProjectMode } from '../../types/project';
import { PROJECT_LIMITS } from '../../types/project';

interface ProjectListProps {
    userId: string;
    mode: ProjectMode;
    selectedProjectId?: string;
    onProjectSelect: (project: Project) => void;
    onProjectEdit?: (project: Project) => void;
}

export default function ProjectList({
    userId,
    mode,
    selectedProjectId,
    onProjectSelect,
    onProjectEdit,
}: ProjectListProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isAtLimit = projects.filter(p => !p.isDefault).length >= PROJECT_LIMITS.MAX_PROJECTS_PER_MODE;

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = projectService.subscribeToProjects(
            userId,
            (projectList) => {
                setProjects(projectList);
                setLoading(false);
            },
            { filters: { mode, isArchived: false } }
        );

        // Ensure default project exists
        projectService.getOrCreateDefaultProject(userId, mode).catch(err => {
            console.error('Failed to create default project:', err);
        });

        return () => unsubscribe();
    }, [userId, mode]);

    const handleProjectCreated = (project: Project) => {
        setShowAddModal(false);
        onProjectSelect(project);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;

        try {
            await projectService.deleteProject(userId, projectToDelete.id, true);
            setProjectToDelete(null);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete project');
        }
    };

    if (loading) {
        return (
            <div className="project-list loading">
                <div className="loading-spinner" />
                <span>Loading projects...</span>
            </div>
        );
    }

    return (
        <div className="project-list">
            <div className="project-list-header">
                <h2 className="project-list-title">
                    Projects
                    <span className="project-count">{projects.length}</span>
                </h2>
                <button
                    className="add-project-btn"
                    onClick={() => setShowAddModal(true)}
                    disabled={isAtLimit}
                    title={isAtLimit ? `Maximum ${PROJECT_LIMITS.MAX_PROJECTS_PER_MODE} projects reached` : 'Add new project'}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {isAtLimit && <span className="limit-reached">Limit reached</span>}
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="project-grid">
                {projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        isSelected={project.id === selectedProjectId}
                        onClick={onProjectSelect}
                        onEdit={!project.isDefault ? onProjectEdit : undefined}
                        onDelete={!project.isDefault ? setProjectToDelete : undefined}
                    />
                ))}
            </div>

            {projects.length === 0 && (
                <div className="empty-state">
                    <span className="empty-icon">📁</span>
                    <p>No projects yet</p>
                    <button
                        className="create-first-btn"
                        onClick={() => setShowAddModal(true)}
                    >
                        Create your first project
                    </button>
                </div>
            )}

            {showAddModal && (
                <AddProjectModal
                    userId={userId}
                    mode={mode}
                    onClose={() => setShowAddModal(false)}
                    onCreated={handleProjectCreated}
                />
            )}

            {projectToDelete && (
                <DeleteProjectConfirmDialog
                    project={projectToDelete}
                    userId={userId}
                    onCancel={() => setProjectToDelete(null)}
                    onConfirm={handleDeleteConfirm}
                />
            )}

            <style>{`
        .project-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .project-list.loading {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .project-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .project-list-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .project-count {
          font-size: 12px;
          font-weight: 500;
          padding: 2px 8px;
          background: #e5e7eb;
          border-radius: 10px;
          color: #6b7280;
        }

        .add-project-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-project-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .add-project-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .limit-reached {
          font-size: 11px;
          opacity: 0.8;
        }

        .error-banner {
          padding: 12px 16px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-banner button {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 18px;
          cursor: pointer;
        }

        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .empty-state {
          padding: 48px 24px;
          text-align: center;
          background: #f9fafb;
          border-radius: 12px;
          border: 2px dashed #e5e7eb;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          display: block;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0 0 16px 0;
        }

        .create-first-btn {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .create-first-btn:hover {
          background: #2563eb;
        }
      `}</style>
        </div>
    );
}
