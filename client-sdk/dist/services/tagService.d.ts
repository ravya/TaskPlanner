/**
 * TaskFlow Client-Side Tag Service
 * Handles tag operations with caching
 */
import { Firestore } from 'firebase/firestore';
import EventEmitter from 'eventemitter3';
import { Tag, CreateTagData, UpdateTagData, ServiceResult } from '../types';
import { TaskFlowConfig } from '../index';
export declare class TagService extends EventEmitter {
    private firestore;
    private config;
    constructor(firestore: Firestore, config: TaskFlowConfig);
    getUserTags(userId: string): Promise<ServiceResult<Tag[]>>;
    createTag(userId: string, tagData: CreateTagData): Promise<ServiceResult<Tag>>;
    updateTag(userId: string, tagId: string, updateData: UpdateTagData): Promise<ServiceResult<Tag>>;
    deleteTag(userId: string, tagId: string): Promise<ServiceResult<void>>;
    updateConfig(config: TaskFlowConfig): void;
}
//# sourceMappingURL=tagService.d.ts.map