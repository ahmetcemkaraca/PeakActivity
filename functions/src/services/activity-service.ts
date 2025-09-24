import { firestore } from 'firebase-admin';
import { ActivityEvent } from '../types/activity-event';
import { DataTransmissionType } from './encryption/DataTransmissionTypes';
import { ActivityDataProcessor } from './data_processing/ActivityDataProcessor';
import { NodeEncryptionService } from './encryption/NodeEncryptionService';
import { KeyDerivationService } from './encryption/KeyDerivationService';

export class ActivityService {
  private db: firestore.Firestore;
  private activityDataProcessor: ActivityDataProcessor;

  constructor() {
    this.db = firestore();
    const nodeEncryptionService = new NodeEncryptionService();
    
    this.activityDataProcessor = new ActivityDataProcessor(nodeEncryptionService);
  }

  async saveActivity(userId: string, activityData: any, transmissionType: DataTransmissionType, userKey?: string) {
    try {
      const { processedData, transmissionType: finalTransmissionType, metadata } = await this.activityDataProcessor.processActivityData(
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
      console.error("Error saving activity:", error);
      throw new Error("Failed to save activity.");
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
      const activitiesRef = this.db.collection(`users/${userId}/activities`);
      const snapshot = await activitiesRef
        .where('timestamp_start', '>=', startDate)
        .where('timestamp_start', '<=', endDate)
        .orderBy('timestamp_start')
        .get();

      return snapshot.docs.map(doc => doc.data() as ActivityEvent);
    } catch (error) {
      console.error("Error getting activities in interval:", error);
      throw new Error("Failed to get activities in interval.");
    }
  }
} 