import * as admin from 'firebase-admin';
import { Tag, CreateTagData, UpdateTagData, ServiceResult, ERROR_CODES } from '../types';

export class TagService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async createTag(userId: string, tagData: CreateTagData): Promise<ServiceResult<Tag>> {
    try {
      const tagRef = this.db.collection('tags').doc();
      const now = admin.firestore.Timestamp.now();
      
      const tag: Tag = {
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
    } catch (error) {
      console.error('Error creating tag:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }

  async getUserTags(userId: string): Promise<ServiceResult<Tag[]>> {
    try {
      const querySnapshot = await this.db.collection('tags')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const tags: Tag[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tags.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Tag);
      });

      return { success: true, data: tags };
    } catch (error) {
      console.error('Error getting user tags:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }

  async updateTag(userId: string, tagId: string, updateData: UpdateTagData): Promise<ServiceResult<Tag>> {
    try {
      const tagRef = this.db.collection('tags').doc(tagId);
      const tagDoc = await tagRef.get();

      if (!tagDoc.exists) {
        return { success: false, error: ERROR_CODES.TAG_NOT_FOUND };
      }

      const tagData = tagDoc.data();
      if (tagData?.userId !== userId) {
        return { success: false, error: ERROR_CODES.UNAUTHORIZED };
      }

      const now = admin.firestore.Timestamp.now();
      const updates = {
        ...updateData,
        updatedAt: now,
      };

      await tagRef.update(updates);

      const updatedDoc = await tagRef.get();
      const updatedData = updatedDoc.data();

      const updatedTag: Tag = {
        ...updatedData,
        id: updatedDoc.id,
        createdAt: updatedData?.createdAt.toDate(),
        updatedAt: updatedData?.updatedAt.toDate(),
      } as Tag;

      return { success: true, data: updatedTag };
    } catch (error) {
      console.error('Error updating tag:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }

  async deleteTag(userId: string, tagId: string): Promise<ServiceResult<void>> {
    try {
      const tagRef = this.db.collection('tags').doc(tagId);
      const tagDoc = await tagRef.get();

      if (!tagDoc.exists) {
        return { success: false, error: ERROR_CODES.TAG_NOT_FOUND };
      }

      const tagData = tagDoc.data();
      if (tagData?.userId !== userId) {
        return { success: false, error: ERROR_CODES.UNAUTHORIZED };
      }

      await tagRef.delete();
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error deleting tag:', error);
      return { success: false, error: ERROR_CODES.INTERNAL_ERROR };
    }
  }
}