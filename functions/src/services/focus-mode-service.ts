import * as functions from 'firebase-functions';
import { db } from '../firebaseAdmin';

interface FocusModeDocument {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  configuration: {
    block_apps?: string[];
    block_categories?: string[];
    mute_notifications?: boolean;
    auto_suggest_breaks?: boolean;
    break_interval_minutes?: number;
    break_duration_minutes?: number;
    allowed_apps?: string[];
    allowed_categories?: string[];
  };
  created_at: number;
  updated_at: number;
  version: number;
}

export class FocusModeService {
  /**
   * Creates a new focus mode for a user.
   * @param userId The ID of the user.
   * @param modeData The data for the new focus mode.
   * @returns The created focus mode document.
   */
  async createFocusMode(
    userId: string,
    modeData: Omit<
      FocusModeDocument,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'version' | 'is_active'
    >
  ): Promise<FocusModeDocument> {
    const newModeRef = db.collection(`users/${userId}/focus_modes`).doc();
    const timestamp = Date.now();
    const focusMode: FocusModeDocument = {
      id: newModeRef.id,
      user_id: userId,
      is_active: false, // Default to inactive
      ...modeData,
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
    };
    await newModeRef.set(focusMode);
    return focusMode;
  }

  /**
   * Retrieves a specific focus mode for a user.
   * @param userId The ID of the user.
   * @param modeId The ID of the focus mode to retrieve.
   * @returns The focus mode document, or null if not found.
   */
  async getFocusMode(userId: string, modeId: string): Promise<FocusModeDocument | null> {
    const modeDoc = await db.collection(`users/${userId}/focus_modes`).doc(modeId).get();
    if (!modeDoc.exists) {
      return null;
    }
    return modeDoc.data() as FocusModeDocument;
  }

  /**
   * Updates an existing focus mode for a user.
   * @param userId The ID of the user.
   * @param modeId The ID of the focus mode to update.
   * @param updates The fields to update.
   * @returns The updated focus mode document, or null if not found.
   */
  async updateFocusMode(
    userId: string,
    modeId: string,
    updates: Partial<Omit<FocusModeDocument, 'id' | 'user_id' | 'created_at'>>
  ): Promise<FocusModeDocument | null> {
    const modeRef = db.collection(`users/${userId}/focus_modes`).doc(modeId);
    const timestamp = Date.now();
    await modeRef.update({
      ...updates,
      updated_at: timestamp,
    });
    const updatedDoc = await modeRef.get();
    if (!updatedDoc.exists) {
      return null;
    }
    return updatedDoc.data() as FocusModeDocument;
  }

  /**
   * Deletes a specific focus mode for a user.
   * @param userId The ID of the user.
   * @param modeId The ID of the focus mode to delete.
   * @returns True if the focus mode was deleted, false otherwise.
   */
  async deleteFocusMode(userId: string, modeId: string): Promise<boolean> {
    const modeRef = db.collection(`users/${userId}/focus_modes`).doc(modeId);
    await modeRef.delete();
    const doc = await modeRef.get();
    return !doc.exists;
  }

  /**
   * Lists all focus modes for a user.
   * @param userId The ID of the user.
   * @returns An array of focus mode documents.
   */
  async listFocusModes(userId: string): Promise<FocusModeDocument[]> {
    const snapshot = await db.collection(`users/${userId}/focus_modes`).get();
    return snapshot.docs.map(doc => doc.data() as FocusModeDocument);
  }

  /**
   * Sets a specific focus mode as active for a user, deactivating others.
   * @param userId The ID of the user.
   * @param modeId The ID of the focus mode to set as active.
   * @returns The activated focus mode document, or null if not found.
   */
  async setActiveFocusMode(userId: string, modeId: string): Promise<FocusModeDocument | null> {
    const batch = db.batch();

    // Deactivate all other focus modes for this user
    const currentActiveModes = await db
      .collection(`users/${userId}/focus_modes`)
      .where('is_active', '==', true)
      .get();
    currentActiveModes.docs.forEach(doc => {
      batch.update(doc.ref, { is_active: false });
    });

    // Activate the specified focus mode
    const modeRef = db.collection(`users/${userId}/focus_modes`).doc(modeId);
    batch.update(modeRef, { is_active: true, updated_at: Date.now() });

    await batch.commit();

    const updatedDoc = await modeRef.get();
    if (!updatedDoc.exists) {
      return null;
    }
    return updatedDoc.data() as FocusModeDocument;
  }
}
