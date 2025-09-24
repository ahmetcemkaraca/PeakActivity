import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { CustomEventService } from '../services/custom-event-service';

const customEventService = new CustomEventService();

/**
 * Firebase Function to create a new custom event.
 */
export const createCustomEvent = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { name, description, type, details } = request.data;

  if (!name || !type || !details) {
    throw new HttpsError('invalid-argument', 'Gerekli alanlar eksik: isim, tip, detaylar.');
  }

  try {
    const newEvent = await customEventService.createCustomEvent(userId, {
      name,
      description,
      type,
      details,
    });
    return { success: true, event: newEvent };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to get a specific custom event.
 */
export const getCustomEvent = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { eventId } = request.data;

  if (!eventId) {
    throw new HttpsError('invalid-argument', 'Etkinlik kimliği eksik.');
  }

  try {
    const event = await customEventService.getCustomEvent(userId, eventId);
    if (!event) {
      throw new HttpsError('not-found', 'Özel etkinlik bulunamadı.');
    }
    return { success: true, event };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to update an existing custom event.
 */
export const updateCustomEvent = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { eventId, updates } = request.data;

  if (!eventId || !updates) {
    throw new HttpsError('invalid-argument', 'Etkinlik kimliği veya güncellemeler eksik.');
  }

  try {
    const updatedEvent = await customEventService.updateCustomEvent(userId, eventId, updates);
    if (!updatedEvent) {
      throw new HttpsError('not-found', 'Güncellenecek özel etkinlik bulunamadı.');
    }
    return { success: true, event: updatedEvent };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to delete a specific custom event.
 */
export const deleteCustomEvent = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { eventId } = request.data;

  if (!eventId) {
    throw new HttpsError('invalid-argument', 'Etkinlik kimliği eksik.');
  }

  try {
    const success = await customEventService.deleteCustomEvent(userId, eventId);
    if (!success) {
      throw new HttpsError('not-found', 'Silinecek özel etkinlik bulunamadı.');
    }
    return { success: true, message: 'Özel etkinlik başarıyla silindi.' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to list all custom events for a user.
 */
export const listCustomEvents = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;

  try {
    const events = await customEventService.listCustomEvents(userId);
    return { success: true, events };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});
