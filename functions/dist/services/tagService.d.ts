import { Tag, CreateTagData, UpdateTagData, ServiceResult } from '../types';
export declare class TagService {
    private db;
    constructor();
    createTag(userId: string, tagData: CreateTagData): Promise<ServiceResult<Tag>>;
    getUserTags(userId: string): Promise<ServiceResult<Tag[]>>;
    updateTag(userId: string, tagId: string, updateData: UpdateTagData): Promise<ServiceResult<Tag>>;
    deleteTag(userId: string, tagId: string): Promise<ServiceResult<void>>;
}
//# sourceMappingURL=tagService.d.ts.map