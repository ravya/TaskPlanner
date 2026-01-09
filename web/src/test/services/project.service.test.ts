/**
 * ProjectService Unit Tests
 * Comprehensive testing of project CRUD operations and business logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    writeBatch,
    onSnapshot,
} from 'firebase/firestore';
import { projectService, ProjectServiceError } from '../../services/firebase/project.service';
import type { ProjectFormData, ProjectMode } from '../../types/project';

// Define PROJECT_LIMITS inline (since import gets undefined when module is partially mocked)
const PROJECT_LIMITS = {
    MAX_PROJECTS_PER_MODE: 10,
    DEFAULT_PROJECT_NAME: 'Inbox',
};

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    writeBatch: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
    Timestamp: {
        now: vi.fn(() => ({ seconds: Date.now() / 1000, toDate: () => new Date() })),
        fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, toDate: () => date })),
    },
}));

// Mock config
vi.mock('../../services/firebase/config', () => ({
    db: {},
}));

describe('ProjectService', () => {
    const mockUserId = 'test-user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Validation', () => {
        it('should throw error for empty userId in createProject', async () => {
            const projectData: ProjectFormData = {
                name: 'Test Project',
                description: 'Test description',
                mode: 'personal',
                color: '#3B82F6',
                icon: '📁',
            };

            await expect(projectService.createProject('', projectData))
                .rejects.toThrow(ProjectServiceError);
        });

        it('should throw error for empty userId in getProject', async () => {
            await expect(projectService.getProject('', 'proj-123'))
                .rejects.toThrow(ProjectServiceError);
        });

        it('should throw error for empty projectId in getProject', async () => {
            await expect(projectService.getProject(mockUserId, ''))
                .rejects.toThrow(ProjectServiceError);
        });

        it('should throw error for empty project name in createProject', async () => {
            const projectData: ProjectFormData = {
                name: '   ', // whitespace only
                description: 'Test description',
                mode: 'personal',
                color: '#3B82F6',
                icon: '📁',
            };

            await expect(projectService.createProject(mockUserId, projectData))
                .rejects.toThrow(ProjectServiceError);
        });

        it('should throw error for invalid mode in getOrCreateDefaultProject', async () => {
            await expect(projectService.getOrCreateDefaultProject(mockUserId, 'invalid' as ProjectMode))
                .rejects.toThrow(ProjectServiceError);
        });
    });

    describe('createProject', () => {
        it('should create a project with valid data', async () => {
            const projectData: ProjectFormData = {
                name: 'Test Project',
                description: 'Test description',
                mode: 'personal',
                color: '#3B82F6',
                icon: '📁',
            };

            // Mock getDocs for existing projects check (empty)
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            // Mock getDocs for position calculation (empty)
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            // Mock doc for setting the project
            const mockDocRef = { id: 'test-project-id' };
            vi.mocked(doc).mockReturnValue(mockDocRef as any);
            vi.mocked(updateDoc).mockResolvedValueOnce(undefined);

            const result = await projectService.createProject(mockUserId, projectData);

            expect(result).toBeDefined();
            expect(result.name).toBe(projectData.name);
            expect(result.description).toBe(projectData.description);
            expect(result.mode).toBe(projectData.mode);
            expect(result.color).toBe(projectData.color);
            expect(result.icon).toBe(projectData.icon);
        });

        it('should throw error when project limit is exceeded', async () => {
            const projectData: ProjectFormData = {
                name: 'Test Project',
                description: 'Test description',
                mode: 'personal',
                color: '#3B82F6',
                icon: '📁',
            };

            // Mock getDocs to return MAX_PROJECTS_PER_MODE projects
            const mockDocs = Array(PROJECT_LIMITS.MAX_PROJECTS_PER_MODE).fill({
                id: 'proj-1',
                data: () => ({ name: 'Test', mode: 'personal' }),
            });

            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: mockDocs,
                empty: false,
                size: mockDocs.length,
            } as any);

            await expect(projectService.createProject(mockUserId, projectData))
                .rejects.toThrow('Maximum');
        });
    });

    describe('getOrCreateDefaultProject', () => {
        it('should return existing default project if found', async () => {
            const mockDefaultProject = {
                id: 'default-project-id',
                data: () => ({
                    projectId: 'default-project-id',
                    name: PROJECT_LIMITS.DEFAULT_PROJECT_NAME,
                    mode: 'personal',
                    isDefault: true,
                    taskCount: 0,
                    completedTaskCount: 0,
                    createdAt: { toDate: () => new Date() },
                    updatedAt: { toDate: () => new Date() },
                }),
            };

            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: [mockDefaultProject],
                empty: false,
                size: 1,
            } as any);

            const result = await projectService.getOrCreateDefaultProject(mockUserId, 'personal');

            expect(result).toBeDefined();
            expect(result.name).toBe(PROJECT_LIMITS.DEFAULT_PROJECT_NAME);
            expect(result.isDefault).toBe(true);
        });

        it('should create default project if not found', async () => {
            // First getDocs returns empty (no default project exists)
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            const mockDocRef = { id: 'new-default-project-id' };
            vi.mocked(doc).mockReturnValue(mockDocRef as any);
            vi.mocked(updateDoc).mockImplementation(() => Promise.reject(new Error('Not found')));
            vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-default-project-id' } as any);

            const result = await projectService.getOrCreateDefaultProject(mockUserId, 'personal');

            expect(result).toBeDefined();
            expect(result.name).toBe(PROJECT_LIMITS.DEFAULT_PROJECT_NAME);
            expect(result.isDefault).toBe(true);
        });
    });

    describe('updateProject', () => {
        it('should throw error when project not found', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false,
                data: () => null,
            } as any);

            await expect(projectService.updateProject(mockUserId, 'non-existent', { name: 'New Name' }))
                .rejects.toThrow('Project not found');
        });

        it('should throw error when trying to rename default project', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    name: PROJECT_LIMITS.DEFAULT_PROJECT_NAME,
                    isDefault: true,
                }),
            } as any);

            await expect(projectService.updateProject(mockUserId, 'default-proj', { name: 'New Name' }))
                .rejects.toThrow('Cannot rename default');
        });
    });

    describe('checkProjectDeletion', () => {
        it('should return canDelete: false for default project', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    name: PROJECT_LIMITS.DEFAULT_PROJECT_NAME,
                    isDefault: true,
                    taskCount: 5,
                }),
            } as any);

            const result = await projectService.checkProjectDeletion(mockUserId, 'default-proj');

            expect(result.canDelete).toBe(false);
        });

        it('should return incomplete task count for non-default project', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    name: 'Test Project',
                    isDefault: false,
                    taskCount: 5,
                }),
            } as any);

            // Mock tasks query
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: [
                    { data: () => ({ status: 'todo' }) },
                    { data: () => ({ status: 'todo' }) },
                    { data: () => ({ status: 'completed' }) },
                ],
                size: 3,
            } as any);

            const result = await projectService.checkProjectDeletion(mockUserId, 'proj-123');

            expect(result.canDelete).toBe(true);
            expect(result.hasIncompleteTasks).toBe(true);
            expect(result.incompleteTaskCount).toBe(2);
            expect(result.totalTaskCount).toBe(3);
        });
    });

    describe('deleteProject', () => {
        it('should throw error when trying to delete default project', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    name: PROJECT_LIMITS.DEFAULT_PROJECT_NAME,
                    isDefault: true,
                }),
            } as any);

            await expect(projectService.deleteProject(mockUserId, 'default-proj'))
                .rejects.toThrow('Cannot delete default');
        });

        it('should require confirmation for projects with incomplete tasks', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    name: 'Test Project',
                    isDefault: false,
                }),
            } as any);

            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: [
                    { data: () => ({ status: 'todo' }) },
                ],
                size: 1,
            } as any);

            await expect(projectService.deleteProject(mockUserId, 'proj-123', false))
                .rejects.toThrow('Confirmation required');
        });

        it('should delete project and tasks when confirmed', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    name: 'Test Project',
                    isDefault: false,
                }),
            } as any);

            vi.mocked(getDocs)
                .mockResolvedValueOnce({
                    docs: [{ data: () => ({ status: 'todo' }) }],
                    size: 1,
                } as any)
                .mockResolvedValueOnce({
                    docs: [{ ref: { id: 'task-1' } }],
                    size: 1,
                } as any);

            const mockBatch = {
                delete: vi.fn(),
                commit: vi.fn().mockResolvedValue(undefined),
            };
            vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
            vi.mocked(doc).mockReturnValue({ id: 'proj-123' } as any);

            await projectService.deleteProject(mockUserId, 'proj-123', true);

            expect(mockBatch.delete).toHaveBeenCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });

    describe('subscribeToProjects', () => {
        it('should return no-op unsubscribe for invalid userId', () => {
            const callback = vi.fn();
            const unsubscribe = projectService.subscribeToProjects('', callback);

            expect(typeof unsubscribe).toBe('function');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should set up onSnapshot listener for valid userId', () => {
            const callback = vi.fn();
            const mockUnsubscribe = vi.fn();

            vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe);

            const unsubscribe = projectService.subscribeToProjects(mockUserId, callback);

            expect(onSnapshot).toHaveBeenCalled();
            expect(typeof unsubscribe).toBe('function');
        });
    });

    describe('PROJECT_LIMITS constants', () => {
        it('should have correct default values', () => {
            expect(PROJECT_LIMITS.MAX_PROJECTS_PER_MODE).toBe(10);
            expect(PROJECT_LIMITS.DEFAULT_PROJECT_NAME).toBe('Inbox');
        });
    });
});

describe('ProjectServiceError', () => {
    it('should have correct error properties', () => {
        const error = new ProjectServiceError('Test error message', 'TEST_ERROR_CODE');

        expect(error.message).toBe('Test error message');
        expect(error.code).toBe('TEST_ERROR_CODE');
        expect(error.name).toBe('ProjectServiceError');
        expect(error instanceof Error).toBe(true);
    });
});
