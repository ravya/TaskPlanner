/**
 * AddProjectModal Component
 * Modal form to create a new project
 */

import { useState } from 'react';
import { projectService } from '../../services/firebase/project.service';
import type { Project, ProjectMode } from '../../types/project';
import { PROJECT_COLORS, PROJECT_ICONS, PROJECT_LIMITS } from '../../types/project';

interface AddProjectModalProps {
    userId: string;
    mode: ProjectMode;
    onClose: () => void;
    onCreated: (project: Project) => void;
}

export default function AddProjectModal({
    userId,
    mode,
    onClose,
    onCreated,
}: AddProjectModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
    const [icon, setIcon] = useState<string>(PROJECT_ICONS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Project name is required');
            return;
        }

        if (name.length > PROJECT_LIMITS.MAX_PROJECT_NAME_LENGTH) {
            setError(`Name must be ${PROJECT_LIMITS.MAX_PROJECT_NAME_LENGTH} characters or less`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const project = await projectService.createProject(userId, {
                name: name.trim(),
                description: description.trim(),
                mode,
                color,
                icon,
            });
            onCreated(project);
        } catch (err: any) {
            setError(err.message || 'Failed to create project');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Project</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="project-name">Project Name</label>
                        <input
                            id="project-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Enter project name"
                            maxLength={PROJECT_LIMITS.MAX_PROJECT_NAME_LENGTH}
                            autoFocus
                        />
                        <span className="char-count">
                            {name.length}/{PROJECT_LIMITS.MAX_PROJECT_NAME_LENGTH}
                        </span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="project-description">Description (optional)</label>
                        <textarea
                            id="project-description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief description of this project"
                            maxLength={PROJECT_LIMITS.MAX_PROJECT_DESCRIPTION_LENGTH}
                            rows={2}
                        />
                    </div>

                    <div className="form-group">
                        <label>Icon</label>
                        <div className="icon-grid">
                            {PROJECT_ICONS.filter(i => i !== '📥').map(i => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`icon-option ${icon === i ? 'selected' : ''}`}
                                    onClick={() => setIcon(i)}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Color</label>
                        <div className="color-grid">
                            {PROJECT_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-option ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>

                <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            padding: 24px;
            width: 90%;
            max-width: 440px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .modal-header h2 {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
          }

          .close-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: #f3f4f6;
            border-radius: 8px;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .close-btn:hover {
            background: #e5e7eb;
          }

          .form-group {
            margin-bottom: 16px;
            position: relative;
          }

          .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
          }

          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.15s ease;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .char-count {
            position: absolute;
            right: 8px;
            top: 34px;
            font-size: 11px;
            color: #9ca3af;
          }

          .icon-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .icon-option {
            width: 40px;
            height: 40px;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 8px;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .icon-option:hover {
            border-color: #d1d5db;
            background: #f9fafb;
          }

          .icon-option.selected {
            border-color: #3b82f6;
            background: #eff6ff;
          }

          .color-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .color-option {
            width: 32px;
            height: 32px;
            border: 3px solid transparent;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .color-option:hover {
            transform: scale(1.1);
          }

          .color-option.selected {
            border-color: #1f2937;
            box-shadow: 0 0 0 2px white inset;
          }

          .error-message {
            padding: 10px 12px;
            background: #fee2e2;
            border-radius: 8px;
            color: #dc2626;
            font-size: 13px;
            margin-bottom: 16px;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            margin-top: 20px;
          }

          .cancel-btn {
            flex: 1;
            padding: 12px;
            background: #f3f4f6;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            cursor: pointer;
          }

          .cancel-btn:hover {
            background: #e5e7eb;
          }

          .submit-btn {
            flex: 1;
            padding: 12px;
            background: #3b82f6;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: white;
            cursor: pointer;
          }

          .submit-btn:hover:not(:disabled) {
            background: #2563eb;
          }

          .submit-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        `}</style>
            </div>
        </div>
    );
}
