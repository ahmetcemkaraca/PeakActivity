import { firestore } from 'firebase-admin';
import { HttpsError } from 'firebase-functions/https';
import { ActivityEvent } from '../types/activity-event';
import { DataTransmissionType } from '../types/activity-event';
import { cacheService } from './cache-service';
import { MonitoringService } from './monitoring-service';
import { ABTestingService } from './ab-testing-service';

export class ActivityService {
  private db: firestore.Firestore;

  constructor() {
    this.db = firestore();
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
      MonitoringService.logError(error, { userId, action: 'createBucket' });
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
      MonitoringService.logError(error, { userId, action: 'getBucket' });
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
      MonitoringService.logError(error, { userId, action: 'updateBucket' });
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
      MonitoringService.logError(error, { userId, action: 'deleteBucket' });
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
      MonitoringService.logError(error, { userId, action: 'createEvent' });
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
      MonitoringService.logError(error, { userId, action: 'getEvent' });
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
      MonitoringService.logError(error, { userId, action: 'updateEvent' });
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
      MonitoringService.logError(error, { userId, action: 'deleteEvent' });
      throw new HttpsError('internal', 'Failed to delete event');
    }
  }

  async getActivitiesInInterval(userId: string, startDate: string, endDate: string) {
    try {
      await this.verifyUser(userId);
      const cacheKey = `activities_${userId}_${startDate}_${endDate}`;
      let activities = cacheService.get(cacheKey);
      
      if (!activities) {
        const snapshot = await this.db.collectionGroup('events')
          .where('user_id', '==', userId)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        activities = snapshot.docs.map(doc => doc.data() as ActivityEvent);
        cacheService.set(cacheKey, activities, 300); // 5 min cache
      }

      // A/B test for different response formats
      const variant = await ABTestingService.assignVariant(userId, 'activity_format', {
        testId: 'activity_format',
        variants: ['standard', 'detailed'],
        defaultVariant: 'standard',
        percentage: 0.5,
      });
      
      if (variant === 'detailed') {
        const detailedActivities = activities.map(activity => ({
          ...activity,
          computedMetrics: {
            productivityScore: this.calculateProductivityScore(activity),
            focusLevel: this.calculateFocusLevel(activity),
          },
        }));
        ABTestingService.trackMetric(userId, 'activity_format', 'detailed', detailedActivities.length);
        return detailedActivities;
      }

      ABTestingService.trackMetric(userId, 'activity_format', 'standard', activities.length);
      return activities;
    } catch (error: any) {
      MonitoringService.logError(error, { userId, action: 'getActivitiesInInterval' });
      throw new HttpsError('internal', 'Failed to get activities');
    }
  }

  private calculateProductivityScore(activity: ActivityEvent): number {
    // Simple calculation
    let score = 0;
    if (activity.category === 'coding' || activity.category === 'productivity') {
      score += 0.8;
    }
    if (activity.input_frequency > 0.5) {
      score += 0.2;
    }
    if (activity.is_afk) {
      score -= 0.3;
    }
    return Math.max(0, Math.min(1, score));
  }

  private calculateFocusLevel(activity: ActivityEvent): number {
    // Simple calculation
    let level = 1;
    if (activity.window_change_count > 5) {
      level -= 0.4;
    }
    if (activity.is_afk) {
      level -= 0.5;
    }
    return Math.max(0, level);
  }
}
