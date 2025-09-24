import * as functions from 'firebase-functions';
import { db } from '../firebaseAdmin';

interface CustomEventDocument {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type:
    | 'app_opened'
    | 'app_closed'
    | 'category_time'
    | 'focus_mode_change'
    | 'idle_time'
    | 'custom';
  details: {
    app_name?: string;
    category?: string;
    duration_seconds?: number;
    from_mode?: string;
    to_mode?: string;
    idle_duration_seconds?: number;
  };
  created_at: number;
  updated_at: number;
  version: number;
}

export class CustomEventService {
  /**
   * Creates a new custom event for a user.
   * @param userId The ID of the user.
   * @param eventData The data for the new custom event.
   * @returns The created custom event document.
   */
  async createCustomEvent(
    userId: string,
    eventData: Omit<CustomEventDocument, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<CustomEventDocument> {
    const newEventRef = db.collection(`users/${userId}/custom_events`).doc();
    const timestamp = Date.now();
    const event: CustomEventDocument = {
      id: newEventRef.id,
      user_id: userId,
      ...eventData,
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
    };
    await newEventRef.set(event);
    return event;
  }

  /**
   * Retrieves a specific custom event for a user.
   * @param userId The ID of the user.
   * @param eventId The ID of the custom event to retrieve.
   * @returns The custom event document, or null if not found.
   */
  async getCustomEvent(userId: string, eventId: string): Promise<CustomEventDocument | null> {
    const eventDoc = await db.collection(`users/${userId}/custom_events`).doc(eventId).get();
    if (!eventDoc.exists) {
      return null;
    }
    return eventDoc.data() as CustomEventDocument;
  }

  /**
   * Updates an existing custom event for a user.
   * @param userId The ID of the user.
   * @param eventId The ID of the custom event to update.
   * @param updates The fields to update.
   * @returns The updated custom event document, or null if not found.
   */
  async updateCustomEvent(
    userId: string,
    eventId: string,
    updates: Partial<Omit<CustomEventDocument, 'id' | 'user_id' | 'created_at'>>
  ): Promise<CustomEventDocument | null> {
    const eventRef = db.collection(`users/${userId}/custom_events`).doc(eventId);
    const timestamp = Date.now();
    await eventRef.update({
      ...updates,
      updated_at: timestamp,
    });
    const updatedDoc = await eventRef.get();
    if (!updatedDoc.exists) {
      return null;
    }
    return updatedDoc.data() as CustomEventDocument;
  }

  /**
   * Deletes a specific custom event for a user.
   * @param userId The ID of the user.
   * @param eventId The ID of the custom event to delete.
   * @returns True if the custom event was deleted, false otherwise.
   */
  async deleteCustomEvent(userId: string, eventId: string): Promise<boolean> {
    const eventRef = db.collection(`users/${userId}/custom_events`).doc(eventId);
    await eventRef.delete();
    const doc = await eventRef.get();
    return !doc.exists;
  }

  /**
   * Lists all custom events for a user.
   * @param userId The ID of the user.
   * @returns An array of custom event documents.
   */
  async listCustomEvents(userId: string): Promise<CustomEventDocument[]> {
    const snapshot = await db.collection(`users/${userId}/custom_events`).get();
    return snapshot.docs.map(doc => doc.data() as CustomEventDocument);
  }
}
