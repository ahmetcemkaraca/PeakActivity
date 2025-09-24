import { firestore } from 'firebase-admin';
import { HttpsError } from 'firebase-functions/https';
import { ActivityEvent } from '../types/activity-event';
import { DataTransmissionType } from './encryption/DataTransmissionTypes';
import { ActivityDataProcessor } from './data_processing/ActivityDataProcessor';
import { NodeEncryptionService } from './encryption/NodeEncryptionService';
import { KeyDerivationService } from './encryption/KeyDerivationService';
import { auth } from '../firebaseAdmin';

export class ActivityService {
  private db: firestore.Firestore;
  private activityDataProcessor: ActivityDataProcessor;

  constructor() {
    this.db = firestore();
    const nodeEncryptionService = new NodeEncryptionService();

    this.activityDataProcessor = new ActivityDataProcessor(nodeEncryptionService);
  }

  private async verifyUser(idToken: string) {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken.uid;
  }

  async createBucket(userId: string, bucketData: any) {
    try {
      const uid = await this.verifyUser(userId);
      if (uid !== userId) {
        throw new HttpsError('permission-denied', 'Unauthorized');
      }

      const bucketRef = this.db.collection(`users/${userId}/buckets`).doc();
      await bucketRef.set({
        ...bucketData,
        user_id: userId,
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, bucketId: bucketRef.id };
    } catch (error: any) {
      console.error('Error creating bucket:', error);
      throw new HttpsError('internal', 'Failed to create bucket');
    }
  }

  async getBucket(userId: string, bucketId: string) {
    try {
      await this.verifyUser(userId);
      const bucketRef = this.db.collection(`users/${userId}/buckets`).doc(bucketId);
      const doc = await bucketRef.get();
      if (!doc.exists) {
        throw new HttpsError('not-found', 'Bucket not found');
      }
      return doc.data();
    } catch (error: any) {
      console.error('Error getting bucket:', error);
      throw new HttpsError('internal', 'Failed to get bucket');
    }
  }

  async updateBucket(userId: string, bucketId: string, updateData: any) {
    try {
      await this.verifyUser(userId);
      const bucketRef = this.db.collection(`users/${userId}/buckets`).doc(bucketId);
      await bucketRef.update({
        ...updateData,
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating bucket:', error);
      throw new HttpsError('internal', 'Failed to update bucket');
    }
  }

  async deleteBucket(userId: string, bucketId: string) {
    try {
      await this.verifyUser(userId);
      const bucketRef = this.db.collection(`users/${userId}/buckets`).doc(bucketId);
      await bucketRef.delete();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting bucket:', error);
      throw new HttpsError('internal', 'Failed to delete bucket');
    }
  }

  async createEvent(userId: string, bucketId: string, eventData: any) {
    try {
      await this.verifyUser(userId);
      const eventRef = this.db.collection(`users/${userId}/buckets/${bucketId}/events`).doc();
      await eventRef.set({
        ...eventData,
        bucket_id: bucketId,
        user_id: userId,
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, eventId: eventRef.id };
    } catch (error: any) {
      console.error('Error creating event:', error);
      throw new HttpsError('internal', 'Failed to create event');
    }
  }

  async getEvent(userId: string, bucketId: string, eventId: string) {
    try {
      await this.verifyUser(userId);
      const eventRef = this.db.collection(`users/${userId}/buckets/${bucketId}/events`).doc(eventId);
      const doc = await eventRef.get();
      if (!doc.exists) {
        throw new HttpsError('not-found', 'Event not found');
      }
      return doc.data() as ActivityEvent;
    } catch (error: any) {
      console.error('Error getting event:', error);
      throw new HttpsError('internal', 'Failed to get event');
    }
  }

  async updateEvent(userId: string, bucketId: string, eventId: string, updateData: any) {
    try {
      await this.verifyUser(userId);
      const eventRef = this.db.collection(`users/${userId}/buckets/${bucketId}/events`).doc(eventId);
      await eventRef.update({
        ...updateData,
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating event:', error);
      throw new HttpsError('internal', 'Failed to update event');
    }
  }

  async deleteEvent(userId: string, bucketId: string, eventId: string) {
    try {
      await this.verifyUser(userId);
      const eventRef = this.db.collection(`users/${userId}/buckets/${bucketId}/events`).doc(eventId);
      await eventRef.delete();
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting event:', error);
      throw new HttpsError('internal', 'Failed to delete event');
    }
  }

  async saveActivity(
    userId: string,
    activityData: any,
    transmissionType: DataTransmissionType,
    userKey?: string
  ) {
    try {
      const {
        processedData,
        transmissionType: finalTransmissionType,
        metadata,
      } = await this.activityDataProcessor.processActivityData(
        JSON.stringify(activityData),
        transmissionType,
        userKey
      );

      const activityRef = this.db.collection(`users/${userId}/activities`).doc();
      await activityRef.set({
        ...JSON.parse(processedData),
        id: activityRef.id,
        user_id: userId,
        transmission_type: finalTransmissionType,
        encryption_metadata: metadata || null,
        created_at: firestore.FieldValue.serverTimestamp(),
        updated_at: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, activityId: activityRef.id };
    } catch (error) {
      console.error('Error saving activity:', error);
      throw new Error('Failed to save activity.');
    }
  }

  /**
   * Belirli bir zaman aralığındaki kullanıcı aktivitelerini getirir.
   * @param userId Kullanıcının Firebase UID'si.
   * @param startDate Getirilecek aktivitelerin başlangıç zamanı (ISO string).
   * @param endDate Getirilecek aktivitelerin bitiş zamanı (ISO string).
   * @returns Aktivite verileri listesi.
   */
  async getActivitiesInInterval(userId: string, startDate: string, endDate: string) {
    try {
      await this.verifyUser(userId);
      const activitiesRef = this.db.collection(`users/${userId}/activities`);
      const snapshot = await activitiesRef
        .where('timestamp_start', '>=', startDate)
        .where('timestamp_start', '<=', endDate)
        .orderBy('timestamp_start')
        .get();

      return snapshot.docs.map(doc => doc.data() as ActivityEvent);
    } catch (error) {
      console.error('Error getting activities in interval:', error);
      throw new Error('Failed to get activities in interval.');
    }
  }
}
