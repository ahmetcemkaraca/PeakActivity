import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { NotificationService } from '../services/notification-service';

const notificationService = new NotificationService();

/**
 * Firebase Function to create a new notification.
 */
export const createNotification = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { title, message, type, action_link, related_entity_id } = request.data;

  if (!title || !message || !type) {
    throw new HttpsError('invalid-argument', 'Gerekli alanlar eksik: başlık, mesaj, tip.');
  }

  try {
    const newNotification = await notificationService.createNotification(userId, {
      title,
      message,
      type,
      action_link,
      related_entity_id,
    });
    return { success: true, notification: newNotification };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to get a specific notification.
 */
export const getNotification = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { notificationId } = request.data;

  if (!notificationId) {
    throw new HttpsError('invalid-argument', 'Bildirim kimliği eksik.');
  }

  try {
    const notification = await notificationService.getNotification(userId, notificationId);
    if (!notification) {
      throw new HttpsError('not-found', 'Bildirim bulunamadı.');
    }
    return { success: true, notification };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to update an existing notification.
 */
export const updateNotification = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { notificationId, updates } = request.data;

  if (!notificationId || !updates) {
    throw new HttpsError('invalid-argument', 'Bildirim kimliği veya güncellemeler eksik.');
  }

  try {
    const updatedNotification = await notificationService.updateNotification(
      userId,
      notificationId,
      updates
    );
    if (!updatedNotification) {
      throw new HttpsError('not-found', 'Güncellenecek bildirim bulunamadı.');
    }
    return { success: true, notification: updatedNotification };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to delete a specific notification.
 */
export const deleteNotification = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { notificationId } = request.data;

  if (!notificationId) {
    throw new HttpsError('invalid-argument', 'Bildirim kimliği eksik.');
  }

  try {
    const success = await notificationService.deleteNotification(userId, notificationId);
    if (!success) {
      throw new HttpsError('not-found', 'Silinecek bildirim bulunamadı.');
    }
    return { success: true, message: 'Bildirim başarıyla silindi.' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to list all notifications for a user.
 */
export const listNotifications = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;

  try {
    const notifications = await notificationService.listNotifications(userId);
    return { success: true, notifications };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});
