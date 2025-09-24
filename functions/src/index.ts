import * as admin from 'firebase-admin';
import { onActivityCreated } from './triggers/firestore-triggers';
import { scheduleAgentGeneration } from './triggers/scheduler-triggers'; // Yeni eklenen import
import * as functions from 'firebase-functions'; // 'firebase-functions' paketini import et
import express from 'express'; // Express'i import et
import cors from 'cors'; // CORS için
import helmet from 'helmet'; // Security headers
import csurf from 'csurf'; // CSRF protection
import { Request, Response } from 'express';
import { z } from 'zod';

import apiRoutes from './api/routes'; // API rotalarını import et
import { errorHandler } from './middlewares/errorHandler'; // Hata işleyiciyi import et
import { generateAgent } from './api/agent-api'; // Yeni eklenen import
import rateLimit from 'express-rate-limit'; // Rate limiting için

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// CORS middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://app.peakactivity.com',
    'https://staging.app.peakactivity.com',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Mevcut API importları (bunlar artık routes.ts içinde kullanılacağı için doğrudan burada kullanılmayacak)
// import { saveActivity } from "./api/activity-api";
// import { generateAIInsights } from "./api/ai-insight-api";
// import { sendAIRecommendationNotification } from "./api/ai-notification-api";
// import { detectAnomalies, getAnomalyAlerts } from "./api/anomaly-detection-api";
// import { autoCategorize } from "./api/auto-categorization-api";
// import { createAutomaticCalendarEvents } from "./api/automatic-event-api";
// import { createAutomationRule, getAllAutomationRules, updateAutomationRule, deleteAutomationRule } from "./api/automation-rule-api";
// import { analyzeRealtimeBehavioralPattern } from "./api/behavioral-analysis-api";
// import { matchCommunityRule } from "./api/community-rules-api";
// import { categorizeContext } from "./api/contextual-categorization-api";
// import { createCustomEvent, getCustomEvent, updateCustomEvent, deleteCustomEvent, listCustomEvents } from "./api/custom-event-api";
// import { createFocusMode, getFocusMode, updateFocusMode, deleteFocusMode, listFocusModes, setActiveFocusMode } from "./api/focus-mode-api";
// import { createGoal, getGoals, updateGoal, deleteGoal } from "./api/goal-api";
// import { createGoal as createGoalManagement, getGoal as getGoalManagement, updateGoal as updateGoalManagement, deleteGoal as deleteGoalManagement, listGoals as getGoalManagements } from "./api/goal-management-api";
// import { getGoogleCalendarEvents, createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent, listGoogleCalendars } from "./api/google-calendar-api";
// import { generateInsight, listInsights, getInsight, deleteInsight } from "./api/insight-generation-api";
// import { createReport, getReport, updateReport, deleteReport, listReports, generateReportData } from "./api/report-management-api";
// import { queryActivities } from "./api/activity-query-api";
// import { CommunityRulesService } from './services/community-rules-service';
// import { CalendarSyncService } from './services/calendar-sync-service';
import {
  linearRegression,
  linearRegressionLine,
  mean,
  standardDeviation,
} from './services/utils/math-utils';
// import { FocusQualityScoreService } from './services/focus-quality-score-service';
// import { createProject, getProject, updateProject, getAllProjects, deleteProject } from './api/project-prediction-api';

// Yeni GenKit importları
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { onCall, onRequest, hasClaim, HttpsError } from 'firebase-functions/v2/https'; // v2'den onCall, onRequest, hasClaim ve HttpsError'ı import et
import { defineSecret } from 'firebase-functions/params';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import { logger } from 'firebase-functions'; // functions.logger yerine logger kullanmak için

// Firebase Admin SDK başlatılıyor
admin.initializeApp();

// Express uygulamasını başlat
const app = express();

// Middleware'ler
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS middleware
app.use(express.json()); // JSON body parsing
app.use(limiter); // Rate limiting middleware
app.use(csurf({ cookie: true })); // CSRF protection (for forms if needed)

// API rotalarını kullan
app.use('/api', apiRoutes);

// Hata işleyici middleware'i (tüm rotalardan sonra eklenmeli)
app.use(errorHandler);

// Firebase Functions olarak Express uygulamasını dışa aktar
export const api = functions.https.onRequest(app);

// Firebase Secret olarak Google AI API Anahtarı tanımlanıyor
const googleAIapiKey = defineSecret('GEMINI_API_KEY');

// GenKit başlatılıyor
const ai = genkit({
  plugins: [googleAI()],
  // Gemini modelini varsayılan olarak kullan
  // TODO: Gelecekte model konfigürasyonunu daha dinamik hale getirilebilir
  model: googleAI.model('gemini-2.5-flash'),
});

// Örnek bir GenKit akışı tanımlama
// Bu akış, verilen bir konu hakkında yapay zeka tarafından şiir oluşturur.
export const generatePoemFlow = ai.defineFlow(
  {
    name: 'generatePoem',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject: string) => {
    const { text } = await ai.generate(`Compose a poem about ${subject}.`);
    return text;
  }
);

// GenKit akışını bir Firebase Callable Cloud Function olarak dışa aktarma
// Kimlik doğrulama politikası ve App Check zorunluluğu ile güvenlik sağlanıyor.
export const callGenkitFlow = onCall(
  {
    secrets: [googleAIapiKey],
    authPolicy: hasClaim('email_verified'), // Sadece e-postası doğrulanmış kullanıcıların erişmesine izin ver
    enforceAppCheck: true,
  },
  async request => {
    if (typeof request.data !== 'string') {
      throw new HttpsError('invalid-argument', 'Konu bir string olmalıdır.');
    }
    const subject = request.data;
    const result = await generatePoemFlow(subject);
    return { text: result };
  }
);

// Mevcut dışa aktarımlar (API ile ilgili olanlar artık Express uygulaması tarafından yönetiliyor)
export { onActivityCreated, generateAgent, scheduleAgentGeneration };

// GenKit instance'ını dışa aktar
export { ai as genkitInstance };

// Eski API dışa aktarımları kaldırılıyor veya Express rotalarına taşındığı için yorum satırı yapılıyor.
// export const activityApi = { saveActivity: saveActivity };
// export const aiInsightApi = { generateAIInsights: generateAIInsights, };
// export const aiNotificationApi = { sendAINotification: sendAIRecommendationNotification, };
// export const anomalyDetectionApi = { detectAnomalies: detectAnomalies, getAnomalyAlerts: getAnomalyAlerts, };
// export const autoCategorizationApi = { autoCategorize: autoCategorize, };
// export const automaticEventApi = { createAutomaticCalendarEvents: createAutomaticCalendarEvents, };
// export const automationRuleApi = { createAutomationRule: createAutomationRule, getAutomationRules: getAllAutomationRules, updateAutomationRule: updateAutomationRule, deleteAutomationRule: deleteAutomationRule, };
// export const behavioralAnalysisApi = { analyzeRealtimeBehavioralPattern: analyzeRealtimeBehavioralPattern, };
// export const communityRulesApi = { matchCommunityRule: matchCommunityRule, };
// export const contextualCategorizationApi = { contextualCategorize: categorizeContext, };
// export const customEventApi = { createCustomEvent: createCustomEvent, getCustomEvents: getCustomEvent, updateCustomEvent: updateCustomEvent, deleteCustomEvent: deleteCustomEvent, listCustomEvents: listCustomEvents, };
// export const focusModeApi = { createFocusMode: createFocusMode, getFocusMode: getFocusMode, updateFocusMode: updateFocusMode, deleteFocusMode: deleteFocusMode, listFocusModes: listFocusModes, setActiveFocusMode: setActiveFocusMode, };
// export const goalApi = { createGoal: createGoal, getGoals: getGoals, updateGoal: updateGoal, deleteGoal: deleteGoal, listGoals: getGoals, // Düzeltildi: listGoals yerine getGoals };
// export const goalManagementApi = { createGoalManagement: createGoalManagement, getGoalManagement: getGoalManagement, updateGoalManagement: updateGoalManagement, deleteGoalManagement: deleteGoalManagement, getGoalManagements: getGoalManagements, };
// export const googleCalendarApi = { getGoogleCalendarEvents: getGoogleCalendarEvents, createGoogleCalendarEvent: createGoogleCalendarEvent, updateGoogleCalendarEvent: updateGoogleCalendarEvent, deleteGoogleCalendarEvent: deleteGoogleCalendarEvent, listGoogleCalendars: listGoogleCalendars, };
// export const insightGenerationApi = { generateInsight: generateInsight, listInsights: listInsights, getInsight: getInsight, deleteInsight: deleteInsight, };
// export const reportManagementApi = { createReport: createReport, getReport: getReport, updateReport: updateReport, deleteReport: deleteReport, listReports: listReports, generateReportData: generateReportData, };
// export const activityQueryApi = { queryActivities: queryActivities, };
// export const projectApi = { createProject: createProject, getProject: updateProject, getAllProjects: getAllProjects, deleteProject: deleteProject, };

// Global settings for all functions in this file
setGlobalOptions({
  region: 'us-central1', // Fonksiyonların dağıtılacağı bölge
  timeoutSeconds: 60, // Varsayılan zaman aşımı süresi
  memory: '256MiB', // Varsayılan bellek boyutu
  concurrency: 50, // Bir instance tarafından aynı anda işlenebilecek istek sayısı
  minInstances: 0, // Soğuk başlangıçları azaltmak için minimum instance sayısı
});

// Fonksiyon çağrısı optimizasyonu: İstemci tarafında gereksiz çağrıları en aza indirin ve fonksiyon içinde erken çıkışlar/veri filtreleme kullanın.

// Firebase Machine Learning (ML) Entegrasyonu için potansiyel entegrasyon noktaları:
// Özel ML modellerinin dağıtımı ve kullanımı genellikle Firebase ML SDK'ları aracılığıyla yapılır.
// Fonksiyonlar, model çıkarımını (inference) tetiklemek veya model çıktılarını işlemek için kullanılabilir.
// Örnek: Kullanıcı davranışı tahmini için bir Cloud Function, eğitilmiş bir ML modelini çağırabilir.
// Örnek: Cihaz içi ML Kit yetenekleri (metin tanıma, görüntü işleme) doğrudan istemci uygulamalarında (Tauri/Mobil) entegre edilebilir.

// Üretken Yapay Zeka ile Akıllı Öneriler için potansiyel entegrasyon noktaları:
// Cloud Functions, Google'ın Gemini API veya Vertex AI gibi üretken AI hizmetleriyle etkileşime girmek için bir aracı görevi görebilir.
// Örnek: Kullanıcının aktivite verilerine dayanarak e-posta veya rapor taslakları oluşturma.
// Örnek: Sık sorulan sorulara dinamik yanıtlar veya bağlama duyarlı tavsiyeler sunma.

// Doğal Dil İşleme (NLP) Yetenekleri için potansiyel entegrasyon noktaları:
// Cloud Functions, metin analizi (duygu, konu, varlık tanıma) veya sohbet botu entegrasyonu için harici NLP API'leri ile etkileşime girebilir.
// Örnek: Kullanıcı geri bildirimlerinin duygu analizi veya aktivite açıklamalarından konu tespiti.
// Örnek: Kullanıcı sorularını yanıtlayan veya görev tamamlamaya yardımcı olan bir sohbet botu entegrasyonu.

// Zaman Serisi Analizi ve Tahminleme için potansiyel entegrasyon noktaları:
// Cloud Functions, zaman serisi verilerini işlemek ve tahmin modellerini (LSTM, Transformer vb.) çalıştırmak için kullanılabilir.
// Örnek: Gelecekteki aktivite desenlerini veya odaklanma seviyelerini tahmin etme.
// Örnek: Aktivite verilerindeki ani düşüşler veya artışlar gibi anomali ve değişim noktalarını tespit etme.

// Harici Servis Entegrasyonları için potansiyel entegrasyon noktaları:
// Cloud Functions, Google Calendar, Trello, Jira gibi harici takvim ve görev yönetimi araçlarıyla entegrasyon için kullanılabilir.
// Örnek: Kullanıcının Google Takvim etkinliklerini senkronize etme, boş zamanlarını tespit etme veya otomatik etkinlikler oluşturma.
// Örnek: Trello/Jira'daki görev durumlarını senkronize etme, proje ilerlemesini takip etme veya görev tamamlama tahminleri yapma.

// İletişim Araçları Entegrasyonları için potansiyel entegrasyon noktaları:
// Cloud Functions, Slack, Microsoft Teams veya e-posta servisleri gibi harici iletişim araçlarıyla entegrasyon için kullanılabilir.
// Örnek: Slack/Teams'e bildirim gönderme, mesajlaşma analizi yapma veya sanal toplantı katılımını izleme.

// Sağlık ve Zindelik Uygulamaları Entegrasyonları için potansiyel entegrasyon noktaları:
// Cloud Functions, uyku takip cihazları (örn. Fitbit, Oura) veya meditasyon uygulamaları gibi harici sağlık ve zindelik uygulamalarıyla entegrasyon için kullanılabilir.
// Örnek: Uyku kalitesi verilerini senkronize etme, enerji seviyeleriyle korelasyon kurma veya uyku düzeni önerileri sunma.
// Örnek: Meditasyon süresi takibi, zihinsel durumla korelasyon veya stres seviyesi analizi yapma.
