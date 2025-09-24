import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { NotificationService } from '../services/notification-service';
import { GoalService } from '../services/goal-service';
import { db } from '../firebaseAdmin'; // Firestore instance'ı
import * as admin from 'firebase-admin'; // FieldValue için

/**
 * Firestore trigger: Aktivite oluşturulduğunda tetiklenir
 *
 * Bu trigger, users/{userId}/activities/{activityId} path'inde yeni bir doküman
 * oluşturulduğunda otomatik olarak çalışır. Ana görevleri:
 *
 * 1. Kullanıcıya yeni aktivite bildirimi gönderir
 * 2. Günlük aktivite özetini (dailySummaries) günceller
 * 3. Hedef ilerlemesini kontrol eder
 * 4. Anomali tespiti yapar (şu anda devre dışı)
 * 5. İlgili bildirimleri gönderir
 *
 * Tetiklenme zamanı: Yeni aktivite dokümanı Firestore'a yazıldığında
 * Kullanım senaryoları:
 * - ActivityWatch watcher'larından gelen otomatik aktivite kayıtları
 * - Manuel aktivite girişleri
 * - Toplu aktivite import işlemleri
 */
export const onActivityCreated = onDocumentCreated(
  'users/{userId}/activities/{activityId}',
  async event => {
    const snapshot = event.data;
    const { userId, activityId } = event.params;

    if (!snapshot) {
      console.warn(`Activity not found: ${activityId}`);
      return;
    }

    const activityData = snapshot.data();

    try {
      // Yeni etkinlik oluşturulduğunda bildirim gönder
      await new NotificationService().createNotification(userId, {
        title: 'Yeni Aktivite Eklendi',
        message: `Yeni bir aktivite kaydedildi: ${activityData.title || 'Bilinmeyen Aktivite'}.`, // Aktivite başlığına göre mesajı kişiselleştir
        type: 'info',
        related_entity_id: activityId,
      });

      // Günlük aktivite özetini güncelle (Firestore Performans Optimizasyonu - Aggregation queries)
      const activityStartTime = new Date(activityData.timestamp_start);
      const activityDate = activityStartTime.toISOString().split('T')[0]; // YYYY-MM-DD formatında tarih
      const durationSeconds = activityData.duration_sec || 0;

      const dailySummaryRef = db.collection(`users/${userId}/dailySummaries`).doc(activityDate);

      await db.runTransaction(async transaction => {
        const doc = await transaction.get(dailySummaryRef);
        if (!doc.exists) {
          transaction.set(dailySummaryRef, {
            date: activityDate,
            total_duration_seconds: durationSeconds,
            activity_count: 1,
            last_updated: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          const currentTotalDuration = doc.data()?.total_duration_seconds || 0;
          const currentActivityCount = doc.data()?.activity_count || 0;
          transaction.update(dailySummaryRef, {
            total_duration_seconds: currentTotalDuration + durationSeconds,
            activity_count: currentActivityCount + 1,
            last_updated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
      console.log(`Kullanıcı ${userId} için ${activityDate} günlük özeti güncellendi.`);

      // 1. Update focus score (AnalyticsService kaldırıldı, ilgili servis çağrısı gerekiyorsa buraya eklenecek)
      // 2. Check goal progress
      const goalUpdates = await GoalService.checkGoalProgress(userId, activityData);

      // 3. Perform anomaly detection (AnalyticsService kaldırıldı, ilgili servis çağrısı gerekiyorsa buraya eklenecek)
      const anomalies: any[] = []; // Geçici olarak boş dizi, anomali tespiti yeniden implement edilmeli

      // 4. Trigger notifications
      if (anomalies.length > 0) {
        await NotificationService.sendAnomalyNotifications(userId, anomalies);
      }

      if (goalUpdates && Object.keys(goalUpdates).length > 0) {
        await NotificationService.sendGoalProgressNotifications(userId, goalUpdates);
      }
    } catch (error) {
      console.error(`Error processing activity creation (${activityId}):`, error);
    }
  }
);

/**
 * Firestore trigger: Bucket oluşturulduğunda tetiklenir
 *
 * Bu trigger, users/{userId}/buckets/{bucketId} path'inde yeni bir doküman
 * oluşturulduğunda çalışır. Ana görevleri:
 *
 * 1. Kullanıcı bucket sayısını güncelle
 * 2. Yeni bucket için hoş geldin bildirimi gönder
 * 3. Bucket validation yap
 * 4. User stats güncelle
 */
export const onBucketCreated = onDocumentCreated(
  'users/{userId}/buckets/{bucketId}',
  async event => {
    const snapshot = event.data;
    const { userId, bucketId } = event.params;

    if (!snapshot) {
      console.warn(`Bucket not found: ${bucketId}`);
      return;
    }

    const bucketData = snapshot.data();

    try {
      // User bucket count güncelle
      const userRef = db.collection('users').doc(userId);
      await db.runTransaction(async transaction => {
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const currentCount = userDoc.data()?.bucket_count || 0;
          transaction.update(userRef, {
            bucket_count: currentCount + 1,
            last_updated: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          transaction.set(userRef, {
            bucket_count: 1,
            last_updated: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      // Yeni bucket için bildirim gönder
      await new NotificationService().createNotification(userId, {
        title: 'Yeni Bucket Eklendi',
        message: `Yeni bucket '${bucketData.type}' başarıyla eklendi.`,
        type: 'info',
        related_entity_id: bucketId,
      });

      console.log(`Kullanıcı ${userId} için bucket ${bucketId} oluşturuldu ve sync edildi.`);
    } catch (error) {
      console.error(`Error processing bucket creation (${bucketId}):`, error);
    }
  }
);
