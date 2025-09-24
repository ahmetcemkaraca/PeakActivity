import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { GoogleCalendarService } from '../services/google-calendar-service';
import { authenticate } from '../firebaseAdmin'; // Firebase Admin SDK kimlik doğrulama

const googleCalendarService = new GoogleCalendarService();

/**
 * Kullanıcının Google Takvim etkinliklerini çeker.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const getGoogleCalendarEvents = onCall(async (request: CallableRequest) => {
  authenticate(request); // Kullanıcının kimliğini doğrula

  const userId = request.auth!.uid;
  const { timeMin, timeMax, calendarId } = request.data as {
    timeMin: string;
    timeMax: string;
    calendarId?: string;
  };

  if (!timeMin || !timeMax) {
    throw new HttpsError('invalid-argument', 'timeMin ve timeMax gereklidir.');
  }

  try {
    const events = await googleCalendarService.getEvents(userId, timeMin, timeMax, calendarId);
    return { success: true, events };
  } catch (error: any) {
    throw new HttpsError('internal', 'Takvim etkinlikleri alınırken hata oluştu.', error.message);
  }
});

/**
 * Google Takvim'de yeni bir etkinlik oluşturur.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const createGoogleCalendarEvent = onCall(async (request: CallableRequest) => {
  authenticate(request); // Kullanıcının kimliğini doğrula

  const userId = request.auth!.uid;
  const { event, calendarId } = request.data as { event: any; calendarId?: string };

  if (!event) {
    throw new HttpsError('invalid-argument', 'Etkinlik verileri gereklidir.');
  }

  try {
    const newEvent = await googleCalendarService.createEvent(userId, event, calendarId);
    return { success: true, event: newEvent };
  } catch (error: any) {
    throw new HttpsError('internal', 'Takvim etkinliği oluşturulurken hata oluştu.', error.message);
  }
});

/**
 * Google Takvim etkinliğini günceller.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const updateGoogleCalendarEvent = onCall(async (request: CallableRequest) => {
  authenticate(request); // Kullanıcının kimliğini doğrula

  const userId = request.auth!.uid;
  const { eventId, event, calendarId } = request.data as {
    eventId: string;
    event: any;
    calendarId?: string;
  };

  if (!eventId || !event) {
    throw new HttpsError('invalid-argument', "Etkinlik ID'si ve etkinlik verileri gereklidir.");
  }

  try {
    const updatedEvent = await googleCalendarService.updateEvent(
      userId,
      eventId,
      event,
      calendarId
    );
    return { success: true, event: updatedEvent };
  } catch (error: any) {
    throw new HttpsError('internal', 'Takvim etkinliği güncellenirken hata oluştu.', error.message);
  }
});

/**
 * Google Takvim etkinliğini siler.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const deleteGoogleCalendarEvent = onCall(async (request: CallableRequest) => {
  authenticate(request); // Kullanıcının kimliğini doğrula

  const userId = request.auth!.uid;
  const { eventId, calendarId } = request.data as { eventId: string; calendarId?: string };

  if (!eventId) {
    throw new HttpsError('invalid-argument', "Etkinlik ID'si gereklidir.");
  }

  try {
    await googleCalendarService.deleteEvent(userId, eventId, calendarId);
    return { success: true };
  } catch (error: any) {
    throw new HttpsError('internal', 'Takvim etkinliği silinirken hata oluştu.', error.message);
  }
});

/**
 * Kullanıcının Google Takvim listesini çeker.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const listGoogleCalendars = onCall(async (request: CallableRequest) => {
  authenticate(request); // Kullanıcının kimliğini doğrula

  const userId = request.auth!.uid;

  try {
    const calendars = await googleCalendarService.listCalendars(userId);
    return { success: true, calendars };
  } catch (error: any) {
    throw new HttpsError('internal', 'Takvimler listelenirken hata oluştu.', error.message);
  }
});
