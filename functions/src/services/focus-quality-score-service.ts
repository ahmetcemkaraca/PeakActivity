import {
  parseISO,
  differenceInSeconds,
  getHours,
  setHours,
  setMinutes,
  setSeconds,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

interface ActivityEvent {
  timestamp_start: string;
  timestamp_end: string;
  duration_sec: number;
  app: string;
  title: string;
  category?: string; // Kategori artık isteğe bağlı
  window_change_count: number;
  input_frequency: number;
  is_afk: boolean;
}

interface SessionScore {
  session_id: string;
  focus_quality_score: number;
  distractions: number;
  context_switch_penalty: number;
}

interface FocusQualityScoreOutput {
  session_scores: SessionScore[];
  daily_average: number | null;
  explanations: string;
}

export class FocusQualityScoreService {
  /**
   * Calculates the focus quality score for a single session.
   * @param sessionEvents Events belonging to the session.
   * @param userTimeZone User's time zone.
   * @returns Calculated session score.
   */
  private calculateSessionScore(
    sessionEvents: ActivityEvent[],
    userTimeZone: string
  ): SessionScore | null {
    if (sessionEvents.length === 0) {
      return null;
    }

    const firstEvent = sessionEvents[0];
    const lastEvent = sessionEvents[sessionEvents.length - 1];

    // Get session start and end times
    const sessionStart = parseISO(firstEvent.timestamp_start);
    const sessionEnd = parseISO(lastEvent.timestamp_end);

    // 1. Base score: Continuous non-AFK time ≥ 5 min.
    let baseScore = 100;
    const sessionDurationMinutes = differenceInSeconds(sessionEnd, sessionStart) / 60;
    if (sessionDurationMinutes < 5 || sessionEvents.some(event => event.is_afk)) {
      return null; // Not a qualifying session
    }

    // 2. -1 point per context switch (window/app change) after the first.
    let contextSwitchPenalty = 0;
    let distractions = 0;
    if (sessionEvents.length > 1) {
      for (let i = 1; i < sessionEvents.length; i++) {
        if (
          sessionEvents[i].app !== sessionEvents[i - 1].app ||
          sessionEvents[i].title !== sessionEvents[i - 1].title
        ) {
          contextSwitchPenalty += 1;
          distractions += 1;
        }
      }
    }
    baseScore -= contextSwitchPenalty;

    // 3. -0.5 point per minute where `input_frequency < 0.1` (passive consumption).
    let passiveConsumptionPenalty = 0;
    for (const event of sessionEvents) {
      if (event.input_frequency < 0.1) {
        passiveConsumptionPenalty += (event.duration_sec / 60) * 0.5;
      }
    }
    baseScore -= passiveConsumptionPenalty;

    // 4. -10 points if any social-media category app is used in the session.
    const socialMediaCategories = ['social']; // Kurala uygun olarak sadece 'social' kategorisi
    if (
      sessionEvents.some(event => event.category && socialMediaCategories.includes(event.category))
    ) {
      baseScore -= 10;
      distractions += 1; // Social media usage is also a distraction
    }

    // 5. +5 points for sessions between 09:00-12:00 local time, -5 for sessions between 00:00-06:00.
    const zonedSessionStart = utcToZonedTime(sessionStart, userTimeZone);
    const startHour = getHours(zonedSessionStart);

    // Define local time ranges (adjusting for time zone differences if necessary)
    // These can be pre-calculated or memoized if this function is called frequently with the same timezone
    const nineAm = 9;
    const twelvePm = 12;
    const midnight = 0;
    const sixAm = 6;

    if (startHour >= nineAm && startHour < twelvePm) {
      baseScore += 5;
    } else if (startHour >= midnight && startHour < sixAm) {
      baseScore -= 5;
    }

    // 6. Clamp scores to the range 0-100.
    const finalScore = Math.max(0, Math.min(100, baseScore));

    return {
      session_id: `${firstEvent.timestamp_start}-${lastEvent.timestamp_end}`,
      focus_quality_score: parseFloat(finalScore.toFixed(0)),
      distractions: distractions,
      context_switch_penalty: contextSwitchPenalty,
    };
  }

  /**
   * Calculates focus quality scores from activity events.
   * @param events Activity events array.
   * @param userTimeZone User's time zone.
   * @returns Output object containing calculated focus quality scores.
   */
  public calculateFocusQualityScores(
    events: ActivityEvent[],
    userTimeZone: string
  ): FocusQualityScoreOutput {
    const sessionScores: SessionScore[] = [];
    let currentSession: ActivityEvent[] = [];

    // Sort events by chronological order (if necessary)
    events.sort(
      (a, b) => new Date(a.timestamp_start).getTime() - new Date(b.timestamp_start).getTime()
    );

    for (const event of events) {
      if (currentSession.length === 0) {
        currentSession.push(event);
      } else {
        const lastEventInSession = currentSession[currentSession.length - 1];
        // If the event starts less than 5 minutes after the end of the previous session, consider it part of the same session
        const gap = differenceInSeconds(
          parseISO(event.timestamp_start),
          parseISO(lastEventInSession.timestamp_end)
        );
        if (gap <= 300) {
          // 5 minutes = 300 seconds
          currentSession.push(event);
        } else {
          const score = this.calculateSessionScore(currentSession, userTimeZone);
          if (score) {
            sessionScores.push(score);
          }
          currentSession = [event];
        }
      }
    }

    // Add the last session
    const score = this.calculateSessionScore(currentSession, userTimeZone);
    if (score) {
      sessionScores.push(score);
    }

    const totalScores = sessionScores.map(s => s.focus_quality_score);
    const dailyAverage =
      totalScores.length > 0
        ? parseFloat((totalScores.reduce((sum, s) => sum + s, 0) / totalScores.length).toFixed(0))
        : null; // Return null if no qualifying sessions

    let explanations = 'Odak kalitesi analizi tamamlandı.';
    if (sessionScores.length === 0) {
      explanations = 'Nitelikli odak oturumu bulunamadı.';
    }

    return {
      session_scores: sessionScores.length > 0 ? sessionScores : [], // Return empty array if no scores
      daily_average: dailyAverage,
      explanations: explanations,
    };
  }
}
