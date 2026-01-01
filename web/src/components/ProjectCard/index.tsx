/**
 * ProjectCard Component
 * Individual project card with progress indicator
 */

import type { Project } from '../../types/project';

interface ProjectCardProps {
    project: Project;
    isSelected?: boolean;
    onClick: (project: Project) => void;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

export default function ProjectCard({
    project,
    isSelected = false,
    onClick,
    onEdit,
    onDelete,
}: ProjectCardProps) {
    const completionRate = project.taskCount > 0
        ? Math.round((project.completedTaskCount / project.taskCount) * 100)
        : 0;

    return (
        <div
            className={`project-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onClick(project)}
            style={{ '--project-color': project.color } as React.CSSProperties}
        >
            <div className="project-header">
                <div className="project-icon-wrapper" style={{ backgroundColor: project.color + '20' }}>
                    <span className="project-icon">{project.icon}</span>
                </div>
                <div className="project-info">
                    <h3 className="project-name">
                        {project.name}
                        {project.isDefault && <span className="default-badge">📥</span>}
                    </h3>
                    {project.description && (
                        <p className="project-description">{project.description}</p>
                    )}
                </div>

                {!project.isDefault && (onEdit || onDelete) && (
                    <div className="project-actions">
                        {onEdit && (
                            <button
                                className="action-btn edit"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(project);
                                }}
                                title="Edit project"
                            >
                                ✏️
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="action-btn delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(project);
                                }}
                                title="Delete project"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="project-stats">
                <div className="stat">
                    <span className="stat-value">{project.taskCount}</span>
                    <span className="stat-label">Tasks</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{project.completedTaskCount}</span>
                    <span className="stat-label">Done</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{completionRate}%</span>
                    <span className="stat-label">Complete</span>
                </div>
            </div>

            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${completionRate}%`, backgroundColor: project.color }}
                />
            </div>

            <style>{`
        .project-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .project-card:hover {
          border-color: var(--project-color, #3b82f6);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .project-card.selected {
          border-color: var(--project-color, #3b82f6);
          background: linear-gradient(180deg, white 0%, #f8fafc 100%);
        }

        .project-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .project-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .project-icon {
          font-size: 20px;
        }

        .project-info {
          flex: 1;
          min-width: 0;
        }

        .project-name {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .default-badge {
          font-size: 12px;
        }

        .project-description {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .project-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .project-card:hover .project-actions {
          opacity: 1;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }

        .action-btn:hover {
          background: #e5e7eb;
        }

        .action-btn.delete:hover {
          background: #fee2e2;
        }

        .project-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .stat-label {
          font-size: 11px;
          color: #9ca3af;
        }

        .progress-bar {
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
      `}</style>
        </div>
    );
}
