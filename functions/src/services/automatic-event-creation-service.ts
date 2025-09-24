import { db } from '../firebaseAdmin';
import { GoogleCalendarService } from './google-calendar-service';
import { ActivityService } from './activity-service';
import { parseISO, format, isWithinInterval, addHours, startOfDay, endOfDay } from 'date-fns';

export class AutomaticEventCreationService {
  private db: any;
  private googleCalendarService: GoogleCalendarService;
  private activityService: ActivityService;

  constructor() {
    this.db = db;
    this.googleCalendarService = new GoogleCalendarService();
    this.activityService = new ActivityService();
  }

  /**
   * Kullanıcının aktivite kalıplarını analiz eder ve Google Takvim'de otomatik olarak etkinlikler oluşturur.
   * @param userId Analiz edilecek kullanıcının Firebase UID'si.
   * @param startDate Analiz edilecek aktivite verilerinin başlangıç tarihi (ISO string).
   * @param endDate Analiz edilecek aktivite verilerinin bitiş tarihi (ISO string).
   * @returns Oluşturulan etkinliklerin listesi.
   */
  async createEventsFromActivityPatterns(userId: string, startDate: string, endDate: string) {
    const createdEvents: any[] = [];
    try {
      const activities = await this.activityService.getActivitiesInInterval(
        userId,
        startDate,
        endDate
      );
      console.log(`Kullanıcı ${userId} için ${activities.length} aktivite bulundu.`);

      // Basit bir örnek: Belirli bir uygulamada uzun süreli odaklanmayı tespit et
      const appFocusThresholdMinutes = 120; // 2 saat
      const focusedApps: { [appName: string]: { duration: number; start: Date; end: Date } } = {};

      for (const activity of activities) {
        if (activity.app && !activity.is_afk) {
          const appName = activity.app;
          const duration = activity.duration_sec / 60; // Dakika cinsinden
          const start = parseISO(activity.timestamp_start);
          const end = parseISO(activity.timestamp_end);

          if (!focusedApps[appName]) {
            focusedApps[appName] = { duration: 0, start: start, end: end };
          }

          focusedApps[appName].duration += duration;
          if (start < focusedApps[appName].start) focusedApps[appName].start = start;
          if (end > focusedApps[appName].end) focusedApps[appName].end = end;
        }
      }

      for (const appName in focusedApps) {
        const focus = focusedApps[appName];
        if (focus.duration >= appFocusThresholdMinutes) {
          const eventSummary = `Odaklanılan Çalışma: ${appName}`;
          const eventDescription = `Bu etkinlik, ${format(focus.start, 'PPP p')} ile ${format(focus.end, 'PPP p')} arasında ${appName} üzerinde ${Math.round(focus.duration)} dakika süren odaklanmış bir çalışma oturumu olarak otomatik olarak oluşturuldu.`;

          const newEvent = {
            summary: eventSummary,
            description: eventDescription,
            start: {
              dateTime: focus.start.toISOString(),
              timeZone: 'UTC', // Kullanıcının zaman dilimini buradan almalıyız
            },
            end: {
              dateTime: focus.end.toISOString(),
              timeZone: 'UTC', // Kullanıcının zaman dilimini buradan almalıyız
            },
          };

          const createdEvent = await this.googleCalendarService.createEvent(userId, newEvent);
          createdEvents.push(createdEvent);
          console.log(`Google Takvim'e yeni etkinlik eklendi: ${eventSummary}`);
        }
      }
    } catch (error) {
      console.error(`Otomatik etkinlik oluşturulurken hata oluştu:`, error);
      throw error;
    }
    return createdEvents;
  }
}
