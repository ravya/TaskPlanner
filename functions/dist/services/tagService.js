"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = void 0;
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
class TagService {
    constructor() {
        this.db = admin.firestore();
    }
    async createTag(userId, tagData) {
        try {
            const tagRef = this.db.collection('tags').doc();
            const now = admin.firestore.Timestamp.now();
            const tag = {
                id: tagRef.id,
                userId,
                name: tagData.name,
                color: tagData.color || '#3B82F6',
                createdAt: now.toDate(),
                updatedAt: now.toDate(),
            };
            await tagRef.set({
                ...tag,
                createdAt: now,
                updatedAt: now,
            });
            return { success: true, data: tag };
        }
        catch (error) {
            console.error('Error creating tag:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
    async getUserTags(userId) {
        try {
            const querySnapshot = await this.db.collection('tags')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            const tags = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                tags.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate(),
                });
            });
            return { success: true, data: tags };
        }
        catch (error) {
            console.error('Error getting user tags:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
    async updateTag(userId, tagId, updateData) {
        try {
            const tagRef = this.db.collection('tags').doc(tagId);
            const tagDoc = await tagRef.get();
            if (!tagDoc.exists) {
                return { success: false, error: types_1.ERROR_CODES.TAG_NOT_FOUND };
            }
            const tagData = tagDoc.data();
            if (tagData?.userId !== userId) {
                return { success: false, error: types_1.ERROR_CODES.UNAUTHORIZED };
            }
            const now = admin.firestore.Timestamp.now();
            const updates = {
                ...updateData,
                updatedAt: now,
            };
            await tagRef.update(updates);
            const updatedDoc = await tagRef.get();
            const updatedData = updatedDoc.data();
            const updatedTag = {
                ...updatedData,
                id: updatedDoc.id,
                createdAt: updatedData?.createdAt.toDate(),
                updatedAt: updatedData?.updatedAt.toDate(),
            };
            return { success: true, data: updatedTag };
        }
        catch (error) {
            console.error('Error updating tag:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
    async deleteTag(userId, tagId) {
        try {
            const tagRef = this.db.collection('tags').doc(tagId);
            const tagDoc = await tagRef.get();
            if (!tagDoc.exists) {
                return { success: false, error: types_1.ERROR_CODES.TAG_NOT_FOUND };
            }
            const tagData = tagDoc.data();
            if (tagData?.userId !== userId) {
                return { success: false, error: types_1.ERROR_CODES.UNAUTHORIZED };
            }
            await tagRef.delete();
            return { success: true, data: undefined };
        }
        catch (error) {
            console.error('Error deleting tag:', error);
            return { success: false, error: types_1.ERROR_CODES.INTERNAL_ERROR };
        }
    }
}
exports.TagService = TagService;
//# sourceMappingURL=tagService.js.map