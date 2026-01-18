import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    increment,
} from 'firebase/firestore';
import { db, auth } from './config';
import { Project, ProjectFormData, ProjectMode, PROJECT_LIMITS } from '../../types';

const PROJECTS_COLLECTION = 'projects';

// Get user's projects collection reference
function getUserProjectsRef(userId: string) {
    return collection(db, 'users', userId, PROJECTS_COLLECTION);
}

// Get projects for a user
export async function getProjects(
    userId: string,
    mode?: ProjectMode
): Promise<Project[]> {
    const projectsRef = getUserProjectsRef(userId);
    const q = query(projectsRef, where('isDeleted', '!=', true));

    const snapshot = await getDocs(q);
    let projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Project[];

    if (mode) {
        projects = projects.filter((p) => p.mode === mode);
    }

    return projects.sort((a, b) => (a.position || 0) - (b.position || 0));
}

// Create a new project
export async function createProject(
    userId: string,
    data: ProjectFormData
): Promise<Project> {
    const projectsRef = getUserProjectsRef(userId);
    const now = new Date().toISOString();

    const projectData = {
        ...data,
        userId,
        taskCount: 0,
        completedTaskCount: 0,
        position: Date.now(),
        createdAt: now,
        updatedAt: now,
        isArchived: false,
        isDeleted: false,
        isDefault: false,
    };

    // Check verification status for limits
    const currentUser = auth.currentUser;
    const isGoogleUser = currentUser?.providerData.some((p: any) => p.providerId === 'google.com');
    const isVerified = currentUser?.emailVerified || isGoogleUser;

    if (!isVerified) {
        // Enforce project limit (3 per mode)
        const projects = await getProjects(userId, data.mode);
        if (projects.filter(p => !p.isDeleted).length >= PROJECT_LIMITS.MAX_PROJECTS_UNVERIFIED) {
            throw new Error(`Unverified accounts are limited to ${PROJECT_LIMITS.MAX_PROJECTS_UNVERIFIED} projects per mode. Please verify your email to create more.`);
        }
    }

    const docRef = await addDoc(projectsRef, projectData);
    return { id: docRef.id, ...projectData } as Project;
}

// Update a project
export async function updateProject(
    userId: string,
    projectId: string,
    updates: Partial<Project>
): Promise<void> {
    const projectRef = doc(db, 'users', userId, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
    });
}

// Delete project (soft delete)
export async function deleteProject(userId: string, projectId: string): Promise<void> {
    await updateProject(userId, projectId, { isDeleted: true });
}

// Subscribe to projects (real-time updates)
export function subscribeToProjects(
    userId: string,
    callback: (projects: Project[]) => void,
    mode?: ProjectMode
): () => void {
    const projectsRef = getUserProjectsRef(userId);
    const q = query(projectsRef, where('isDeleted', '!=', true));

    return onSnapshot(q, (snapshot) => {
        let projects = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Project[];

        if (mode) {
            projects = projects.filter((p) => p.mode === mode);
        }

        callback(projects.sort((a, b) => (a.position || 0) - (b.position || 0)));
    });
}

// Adjust project task counts
export async function adjustProjectTaskCounts(
    userId: string,
    projectId: string,
    deltaTotal: number,
    deltaCompleted: number
): Promise<void> {
    const projectRef = doc(db, 'users', userId, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
        taskCount: increment(deltaTotal),
        completedTaskCount: increment(deltaCompleted),
        updatedAt: new Date().toISOString(),
    });
}
