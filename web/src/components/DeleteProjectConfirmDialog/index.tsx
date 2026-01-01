/**
 * DeleteProjectConfirmDialog Component
 * Confirmation dialog for deleting a project with incomplete tasks
 */

import { useState, useEffect } from 'react';
import { projectService } from '../../services/firebase/project.service';
import type { Project, ProjectDeletionCheck } from '../../types/project';

interface DeleteProjectConfirmDialogProps {
    project: Project;
    userId: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteProjectConfirmDialog({
    project,
    userId,
    onCancel,
    onConfirm,
}: DeleteProjectConfirmDialogProps) {
    const [deletionCheck, setDeletionCheck] = useState<ProjectDeletionCheck | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkDeletion = async () => {
            try {
                const check = await projectService.checkProjectDeletion(userId, project.id);
                setDeletionCheck(check);
            } catch (err: any) {
                setError(err.message || 'Failed to check project');
            } finally {
                setLoading(false);
            }
        };

        checkDeletion();
    }, [userId, project.id]);

    const handleConfirm = async () => {
        setDeleting(true);
        setError(null);

        try {
            await projectService.deleteProject(userId, project.id, true);
            onConfirm();
        } catch (err: any) {
            setError(err.message || 'Failed to delete project');
            setDeleting(false);
        }
    };

    return (
        <div className="dialog-overlay" onClick={onCancel}>
            <div className="dialog-content" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        Checking project...
                    </div>
                ) : (
                    <>
                        <div className="dialog-icon">
                            <span>⚠️</span>
                        </div>

                        <h3 className="dialog-title">Delete "{project.name}"?</h3>

                        {deletionCheck?.hasIncompleteTasks ? (
                            <div className="warning-message">
                                <strong>Some tasks are not finished!</strong>
                                <p>
                                    This project has <span className="highlight">{deletionCheck.incompleteTaskCount}</span> incomplete
                                    task{deletionCheck.incompleteTaskCount !== 1 ? 's' : ''} out of {deletionCheck.totalTaskCount} total.
                                </p>
                                <p>Deleting this project will also delete all its tasks.</p>
                            </div>
                        ) : (
                            <p className="info-message">
                                {deletionCheck?.totalTaskCount
                                    ? `This will delete the project and ${deletionCheck.totalTaskCount} completed task${deletionCheck.totalTaskCount !== 1 ? 's' : ''}.`
                                    : 'This project has no tasks. It will be permanently deleted.'}
                            </p>
                        )}

                        {error && (
                            <div className="error-message">{error}</div>
                        )}

                        <div className="dialog-actions">
                            <button
                                className="cancel-btn"
                                onClick={onCancel}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={handleConfirm}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete Project'}
                            </button>
                        </div>
                    </>
                )}

                <style>{`
          .dialog-overlay {
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

          .dialog-content {
            background: white;
            border-radius: 16px;
            padding: 24px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          }

          .loading-state {
            padding: 40px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            color: #6b7280;
          }

          .spinner {
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

          .dialog-icon {
            margin-bottom: 16px;
          }

          .dialog-icon span {
            font-size: 48px;
          }

          .dialog-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 16px 0;
          }

          .warning-message {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 16px;
            text-align: left;
            margin-bottom: 16px;
          }

          .warning-message strong {
            color: #92400e;
            display: block;
            margin-bottom: 8px;
          }

          .warning-message p {
            color: #78350f;
            font-size: 13px;
            margin: 4px 0;
          }

          .warning-message .highlight {
            font-weight: 600;
            color: #dc2626;
          }

          .info-message {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 20px;
          }

          .error-message {
            padding: 10px;
            background: #fee2e2;
            border-radius: 8px;
            color: #dc2626;
            font-size: 13px;
            margin-bottom: 16px;
          }

          .dialog-actions {
            display: flex;
            gap: 12px;
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

          .cancel-btn:hover:not(:disabled) {
            background: #e5e7eb;
          }

          .confirm-btn {
            flex: 1;
            padding: 12px;
            background: #dc2626;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: white;
            cursor: pointer;
          }

          .confirm-btn:hover:not(:disabled) {
            background: #b91c1c;
          }

          .cancel-btn:disabled,
          .confirm-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
            </div>
        </div>
    );
}
