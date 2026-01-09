/**
 * TaskFlow Project Service
 * Firebase Firestore service for project CRUD operations
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    writeBatch,
    serverTimestamp,
    CollectionReference,
    DocumentSnapshot,
    QueryDocumentSnapshot,
    FirestoreError,
    Timestamp,
} from 'firebase/firestore';

import { db } from './config';
import type {
    Project,
    ProjectFormData,
    ProjectUpdateData,
    ProjectQueryOptions,
    ProjectDeletionCheck,
    ProjectMode,
} from '../../types/project';
import { PROJECT_LIMITS } from '../../types/project';

// Custom error type
export class ProjectServiceError extends Error {
    constructor(
        message: string,
        public code?: string,
        public originalError?: FirestoreError
    ) {
        super(message);
        this.name = 'ProjectServiceError';
    }
}

class ProjectService {
    // Get user's projects collection reference
    private getUserProjectsRef(userId: string): CollectionReference {
        return collection(db, 'users', userId, 'projects');
    }

    // Generate unique project ID
    private generateProjectId(): string {
        return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate userId
    private validateUserId(userId: string): void {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new ProjectServiceError('Valid userId is required', 'INVALID_USER_ID');
        }
    }

    // Validate projectId
    private validateProjectId(projectId: string): void {
        if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
            throw new ProjectServiceError('Valid projectId is required', 'INVALID_PROJECT_ID');
        }
    }

    /**
     * Create a new project
     */
    async createProject(userId: string, data: ProjectFormData): Promise<Project> {
        this.validateUserId(userId);
        if (!data?.name?.trim()) {
            throw new ProjectServiceError('Project name is required', 'INVALID_PROJECT_NAME');
        }
        try {
            // Check project limit for the mode
            const existingProjects = await this.getProjects(userId, { filters: { mode: data.mode } });
            if (existingProjects.length >= PROJECT_LIMITS.MAX_PROJECTS_PER_MODE) {
                throw new ProjectServiceError(
                    `Maximum ${PROJECT_LIMITS.MAX_PROJECTS_PER_MODE} projects allowed per mode`,
                    'PROJECT_LIMIT_EXCEEDED'
                );
            }

            // Calculate next position
            const maxPosition = existingProjects.reduce((max, p) => Math.max(max, p.position), 0);

            const projectId = this.generateProjectId();
            const now = Timestamp.now();

            const projectData = {
                projectId,
                name: data.name.trim(),
                description: data.description?.trim() || '',
                mode: data.mode,
                color: data.color || '#3B82F6',
                icon: data.icon || '📁',
                taskCount: 0,
                completedTaskCount: 0,
                createdAt: now,
                updatedAt: now,
                userId,
                isArchived: false,
                isDeleted: false,
                isDefault: false,
                position: maxPosition + 1,
            };

            const docRef = doc(this.getUserProjectsRef(userId), projectId);
            await updateDoc(docRef, projectData).catch(() => {
                return addDoc(this.getUserProjectsRef(userId), projectData);
            });

            return this.mapDocumentToProject({ id: projectId, ...projectData } as any);
        } catch (error) {
            if (error instanceof ProjectServiceError) throw error;
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to create project');
        }
    }

    /**
     * Get or create default Inbox project for a mode
     */
    async getOrCreateDefaultProject(userId: string, mode: ProjectMode): Promise<Project> {
        this.validateUserId(userId);
        if (!mode || (mode !== 'personal' && mode !== 'professional')) {
            throw new ProjectServiceError('Valid mode is required', 'INVALID_MODE');
        }
        try {
            const projectsRef = this.getUserProjectsRef(userId);
            const q = query(
                projectsRef,
                where('isDefault', '==', true),
                where('mode', '==', mode),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                return this.mapDocumentToProject(snapshot.docs[0]);
            }

            const projectId = this.generateProjectId();
            const now = Timestamp.now();

            const projectData = {
                projectId,
                name: PROJECT_LIMITS.DEFAULT_PROJECT_NAME,
                description: 'Default project for unassigned tasks',
                mode,
                color: '#6B7280',
                icon: '📥',
                taskCount: 0,
                completedTaskCount: 0,
                createdAt: now,
                updatedAt: now,
                userId,
                isArchived: false,
                isDeleted: false,
                isDefault: true,
                position: 0,
            };

            const docRef = doc(this.getUserProjectsRef(userId), projectId);
            await updateDoc(docRef, projectData).catch(async () => {
                await addDoc(this.getUserProjectsRef(userId), projectData);
            });

            return this.mapDocumentToProject({ id: projectId, ...projectData } as any);
        } catch (error) {
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to get/create default project');
        }
    }

    /**
     * Update a project
     */
    async updateProject(userId: string, projectId: string, updates: ProjectUpdateData): Promise<Project> {
        this.validateUserId(userId);
        this.validateProjectId(projectId);
        try {
            const projectRef = doc(this.getUserProjectsRef(userId), projectId);
            const projectDoc = await getDoc(projectRef);

            if (!projectDoc.exists()) {
                throw new ProjectServiceError('Project not found', 'PROJECT_NOT_FOUND');
            }

            const existingData = projectDoc.data();

            if (existingData.isDefault && updates.name && updates.name !== existingData.name) {
                throw new ProjectServiceError('Cannot rename default Inbox project', 'CANNOT_RENAME_DEFAULT');
            }

            const updateData: any = {
                ...updates,
                updatedAt: serverTimestamp(),
            };

            if (updates.name) {
                updateData.name = updates.name.trim();
            }
            if (updates.description !== undefined) {
                updateData.description = updates.description.trim();
            }

            await updateDoc(projectRef, updateData);

            const updatedDoc = await getDoc(projectRef);
            return this.mapDocumentToProject(updatedDoc);
        } catch (error) {
            if (error instanceof ProjectServiceError) throw error;
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to update project');
        }
    }

    /**
     * Get a single project by ID
     */
    async getProject(userId: string, projectId: string): Promise<Project> {
        this.validateUserId(userId);
        this.validateProjectId(projectId);
        try {
            const projectRef = doc(this.getUserProjectsRef(userId), projectId);
            const projectDoc = await getDoc(projectRef);

            if (!projectDoc.exists()) {
                throw new ProjectServiceError('Project not found', 'PROJECT_NOT_FOUND');
            }

            return this.mapDocumentToProject(projectDoc);
        } catch (error) {
            if (error instanceof ProjectServiceError) throw error;
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to get project');
        }
    }

    /**
     * Get all projects for a user with optional filtering
     */
    async getProjects(userId: string, options: ProjectQueryOptions = {}): Promise<Project[]> {
        this.validateUserId(userId);
        try {
            const projectsRef = this.getUserProjectsRef(userId);
            let q = query(projectsRef, where('isDeleted', '==', false));

            if (options.filters?.mode) {
                q = query(q, where('mode', '==', options.filters.mode));
            }
            if (options.filters?.isArchived !== undefined) {
                q = query(q, where('isArchived', '==', options.filters.isArchived));
            }

            const orderField = options.orderBy || 'position';
            const direction = options.orderDirection || 'asc';
            q = query(q, orderBy(orderField, direction));

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => this.mapDocumentToProject(doc));
        } catch (error) {
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to get projects');
        }
    }

    /**
     * Check if a project can be deleted
     */
    async checkProjectDeletion(userId: string, projectId: string): Promise<ProjectDeletionCheck> {
        this.validateUserId(userId);
        this.validateProjectId(projectId);
        try {
            const projectRef = doc(this.getUserProjectsRef(userId), projectId);
            const projectDoc = await getDoc(projectRef);

            if (!projectDoc.exists()) {
                throw new ProjectServiceError('Project not found', 'PROJECT_NOT_FOUND');
            }

            const project = projectDoc.data();

            if (project.isDefault) {
                return {
                    canDelete: false,
                    hasIncompleteTasks: false,
                    incompleteTaskCount: 0,
                    totalTaskCount: project.taskCount || 0,
                };
            }

            const tasksRef = collection(db, 'users', userId, 'tasks');
            const tasksQuery = query(
                tasksRef,
                where('projectId', '==', projectId),
                where('isDeleted', '==', false)
            );
            const tasksSnapshot = await getDocs(tasksQuery);

            let incompleteCount = 0;
            tasksSnapshot.docs.forEach(taskDoc => {
                const task = taskDoc.data();
                if (task.status !== 'completed' && !task.completed) {
                    incompleteCount++;
                }
            });

            return {
                canDelete: true,
                hasIncompleteTasks: incompleteCount > 0,
                incompleteTaskCount: incompleteCount,
                totalTaskCount: tasksSnapshot.size,
            };
        } catch (error) {
            if (error instanceof ProjectServiceError) throw error;
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to check project deletion');
        }
    }

    /**
     * Delete a project and all its tasks
     */
    async deleteProject(userId: string, projectId: string, confirmed: boolean = false): Promise<void> {
        this.validateUserId(userId);
        this.validateProjectId(projectId);
        try {
            const deletionCheck = await this.checkProjectDeletion(userId, projectId);

            if (!deletionCheck.canDelete) {
                throw new ProjectServiceError('Cannot delete default Inbox project', 'CANNOT_DELETE_DEFAULT');
            }

            if (deletionCheck.hasIncompleteTasks && !confirmed) {
                throw new ProjectServiceError(
                    `Project has ${deletionCheck.incompleteTaskCount} incomplete task(s). Confirmation required.`,
                    'CONFIRMATION_REQUIRED'
                );
            }

            const batch = writeBatch(db);

            const tasksRef = collection(db, 'users', userId, 'tasks');
            const tasksQuery = query(tasksRef, where('projectId', '==', projectId));
            const tasksSnapshot = await getDocs(tasksQuery);

            tasksSnapshot.docs.forEach(taskDoc => {
                batch.delete(taskDoc.ref);
            });

            const projectRef = doc(this.getUserProjectsRef(userId), projectId);
            batch.delete(projectRef);

            await batch.commit();
        } catch (error) {
            if (error instanceof ProjectServiceError) throw error;
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to delete project');
        }
    }

    /**
     * Update task counts for a project
     */
    async updateTaskCounts(userId: string, projectId: string): Promise<void> {
        this.validateUserId(userId);
        this.validateProjectId(projectId);
        try {
            const tasksRef = collection(db, 'users', userId, 'tasks');
            const tasksQuery = query(
                tasksRef,
                where('projectId', '==', projectId),
                where('isDeleted', '==', false)
            );
            const snapshot = await getDocs(tasksQuery);

            let taskCount = 0;
            let completedCount = 0;

            snapshot.docs.forEach(taskDoc => {
                const task = taskDoc.data();
                taskCount++;
                if (task.status === 'completed' || task.completed) {
                    completedCount++;
                }
            });

            const projectRef = doc(this.getUserProjectsRef(userId), projectId);
            await updateDoc(projectRef, {
                taskCount,
                completedTaskCount: completedCount,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            throw this.handleFirestoreError(error as FirestoreError, 'Failed to update task counts');
        }
    }

    /**
     * Subscribe to real-time project updates
     */
    subscribeToProjects(
        userId: string,
        callback: (projects: Project[]) => void,
        options: ProjectQueryOptions = {}
    ): () => void {
        // Validate synchronously before setting up subscription
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            console.error('Invalid userId for project subscription');
            return () => { }; // Return no-op unsubscribe
        }

        const projectsRef = this.getUserProjectsRef(userId);
        let q = query(projectsRef, where('isDeleted', '==', false));

        if (options.filters?.mode) {
            q = query(q, where('mode', '==', options.filters.mode));
        }

        q = query(q, orderBy(options.orderBy || 'position', options.orderDirection || 'asc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const projects = snapshot.docs.map(doc => this.mapDocumentToProject(doc));
                callback(projects);
            },
            (error) => {
                console.error('Projects subscription error:', error);
            }
        );
    }

    /**
     * Map Firestore document to Project type
     */
    private mapDocumentToProject(doc: DocumentSnapshot | QueryDocumentSnapshot | any): Project {
        const data = doc.data?.() || doc;

        return {
            id: doc.id || data.projectId,
            name: data.name || '',
            description: data.description || '',
            mode: data.mode || 'personal',
            color: data.color || '#3B82F6',
            icon: data.icon || '📁',
            taskCount: data.taskCount || 0,
            completedTaskCount: data.completedTaskCount || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            userId: data.userId || '',
            isArchived: data.isArchived || false,
            isDeleted: data.isDeleted || false,
            isDefault: data.isDefault || false,
            position: data.position || 0,
        };
    }

    /**
     * Handle Firestore errors
     */
    private handleFirestoreError(error: FirestoreError, defaultMessage: string): ProjectServiceError {
        console.error('Firestore error:', error);
        return new ProjectServiceError(
            error.message || defaultMessage,
            error.code,
            error
        );
    }
}

// Export singleton instance
export const projectService = new ProjectService();
