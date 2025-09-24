import { Request, Response, Router } from 'express';

import { ActivityService } from '../services/activity-service';
import { AIInsightService } from '../services/ai-insight-service';
import { NotificationService } from '../services/notification-service';
import { AnomalyDetectionService } from '../services/anomaly-detection-service';
import { AutoCategorizationService } from '../services/auto-categorization-service';
import { AutomaticEventCreationService } from '../services/automatic-event-creation-service';
import { AutomationRuleService } from '../services/automation-rule-service';
import { BehavioralAnalysisService } from '../services/behavioral-analysis-service';
import { CommunityRulesService } from '../services/community-rules-service';
import { ContextualCategorizationService } from '../services/contextual-categorization-service';
import { CustomContextualRulesService } from '../services/custom-contextual-rules-service';
import { CustomEventService } from '../services/custom-event-service';
import { FocusModeService } from "../services/focus-mode-service";
import { GoalService } from "../services/goal-service";
import { ProjectPredictionService } from "../services/project-prediction-service";
import { ReportManagementService } from "../services/report-management-service";
import { AINotificationService } from '../services/ai-notification-service';
import { MasterKeyService } from '../services/encryption/MasterKeyService';
import { KeyRotationService } from '../services/encryption/KeyRotationService';
import { KeyRecoveryService } from '../services/KeyRecoveryService';
import { KeyDerivationService } from '../services/encryption/KeyDerivationService';
import { NodeEncryptionService } from '../services/encryption/NodeEncryptionService';
import { SecureStorageService } from '../services/encryption/SecureStorageService';
import { FeedbackService } from '../services/feedback-service'; // FeedbackService import edildi

// Yardımcı fonksiyonlar ve tipler için importlar
import { ActivityEvent } from '../types/activity-event.d';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/api-response-formats';
import { UnauthorizedError, InvalidArgumentError, NotFoundError } from '../utils/api-error-codes';

const router = Router();

const activityService = new ActivityService();
const aiInsightService = new AIInsightService();
const notificationService = new NotificationService();
const anomalyDetectionService = new AnomalyDetectionService();
const autoCategorizationService = new AutoCategorizationService();
const automaticEventCreationService = new AutomaticEventCreationService();
const automationRuleService = new AutomationRuleService();
const behavioralAnalysisService = new BehavioralAnalysisService();
const communityRulesService = new CommunityRulesService();
const contextualCategorizationService = new ContextualCategorizationService();
const customContextualRulesService = new CustomContextualRulesService();
const customEventService = new CustomEventService();
const focusModeService = new FocusModeService();
// GoalService static metotları içerdiği için burada örnek oluşturmaya gerek yok.
const projectPredictionService = new ProjectPredictionService();
const reportManagementService = new ReportManagementService();
const aiNotificationService = new AINotificationService();
const feedbackService = new FeedbackService(); // FeedbackService örneği oluşturuldu

// Encryption Services
const keyDerivationService = new KeyDerivationService();
const secureStorageService = new SecureStorageService(); // Firestore'a bağımlılığı olan bir servis
const nodeEncryptionService = new NodeEncryptionService();

const masterKeyService = new MasterKeyService(secureStorageService, keyDerivationService);
const keyRotationService = new KeyRotationService(masterKeyService, secureStorageService, nodeEncryptionService);
const keyRecoveryService = new KeyRecoveryService(secureStorageService); // SecureStorageService bağımlılığı eklendi

// Activity API rotası: Yeni aktivite kaydet
router.post('/activity', asyncHandler(async (req: Request, res: Response) => {
  const { userId, activityEvent } = req.body;
  if (!userId || !activityEvent) {
    throw new InvalidArgumentError('Kullanıcı kimliği ve aktivite verileri eksik.');
  }
  const result = await activityService.saveActivity(userId, activityEvent);
  res.status(201).json(successResponse(result, 'Aktivite başarıyla kaydedildi.'));
}));

// Project API rotaları:
router.post('/projects', asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, description, start_date, due_date, status } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!title || !start_date || !due_date || !status) {
    throw new InvalidArgumentError('Gerekli alanlar eksik: başlık, başlangıç tarihi, bitiş tarihi, durum.');
  }
  const newProject = await projectPredictionService.createProject(userId, { title, description, start_date, due_date, status });
  res.status(201).json(successResponse(newProject, 'Proje başarıyla oluşturuldu.'));
}));

router.get('/projects/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { projectId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!projectId) {
    throw new InvalidArgumentError('Proje kimliği eksik.');
  }
  const project = await projectPredictionService.getProject(userId, projectId);
  if (!project) {
    throw new NotFoundError('Proje bulunamadı.');
  }
  res.status(200).json(successResponse(project));
}));

router.put('/projects/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { projectId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!projectId || !updates) {
    throw new InvalidArgumentError('Proje kimliği veya güncellemeler eksik.');
  }
  const updatedProject = await projectPredictionService.updateProject(userId, projectId, updates);
  if (!updatedProject) {
    throw new NotFoundError('Güncellenecek proje bulunamadı.');
  }
  res.status(200).json(successResponse(updatedProject, 'Proje başarıyla güncellendi.'));
}));

router.delete('/projects/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { projectId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!projectId) {
    throw new InvalidArgumentError('Proje kimliği eksik.');
  }
  await projectPredictionService.deleteProject(userId, projectId);
  res.status(200).json(successResponse(null, 'Proje başarıyla silindi.'));
}));

router.get('/projects', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const projects = await projectPredictionService.getAllProjects(userId);
  res.status(200).json(successResponse(projects));
}));

// Report API rotaları:
router.post('/reports', asyncHandler(async (req: Request, res: Response) => {
  const { userId, name, type, configuration } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!name || !type || !configuration) {
    throw new InvalidArgumentError('Gerekli alanlar eksik: isim, tür, konfigürasyon.');
  }
  if (type !== 'report' && type !== 'dashboard') {
    throw new InvalidArgumentError('Geçersiz rapor türü. Sadece "report" veya "dashboard" olabilir.');
  }
  const newReport = await reportManagementService.createReport(userId, { name, type, configuration });
  res.status(201).json(successResponse(newReport, 'Rapor başarıyla oluşturuldu.'));
}));

router.get('/reports/:reportId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { reportId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!reportId) {
    throw new InvalidArgumentError('Rapor kimliği eksik.');
  }
  const report = await reportManagementService.getReport(userId, reportId);
  if (!report) {
    throw new NotFoundError('Rapor bulunamadı.');
  }
  res.status(200).json(successResponse(report));
}));

router.put('/reports/:reportId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { reportId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!reportId || !updates) {
    throw new InvalidArgumentError('Rapor kimliği veya güncellemeler eksik.');
  }
  const updatedReport = await reportManagementService.updateReport(userId, reportId, updates);
  if (!updatedReport) {
    throw new NotFoundError('Güncellenecek rapor bulunamadı.');
  }
  res.status(200).json(successResponse(updatedReport, 'Rapor başarıyla güncellendi.'));
}));

router.delete('/reports/:reportId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { reportId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!reportId) {
    throw new InvalidArgumentError('Rapor kimliği eksik.');
  }
  const success = await reportManagementService.deleteReport(userId, reportId);
  if (!success) {
    throw new NotFoundError('Silinecek rapor bulunamadı.');
  }
  res.status(200).json(successResponse(null, 'Rapor başarıyla silindi.'));
}));

router.get('/reports', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const reports = await reportManagementService.listReports(userId);
  res.status(200).json(successResponse(reports));
}));

router.post('/reports/:reportId/generate-data', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { reportId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!reportId) {
    throw new InvalidArgumentError('Rapor kimliği eksik.');
  }
  // Rapor veri üretme mantığı buraya eklenecek
  res.status(200).json(successResponse(null, 'Rapor verileri başarıyla üretildi. (Simüle edildi)'));
}));

// Encryption API rotaları
router.post('/encryption/master-password-setup', asyncHandler(async (req: Request, res: Response) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    throw new InvalidArgumentError('Kullanıcı kimliği veya parola eksik.');
  }
  const result = await masterKeyService.setupMasterPassword(userId, password);
  res.status(200).json(successResponse(result, 'Ana parola başarıyla ayarlandı.'));
}));

router.post('/encryption/rotate-keys', asyncHandler(async (req: Request, res: Response) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    throw new InvalidArgumentError('Kullanıcı kimliği, eski parola veya yeni parola eksik.');
  }
  const result = await keyRotationService.rotateUserKeyAndData(userId, oldPassword, newPassword);
  res.status(200).json(successResponse(result, 'Anahtarlar başarıyla döndürüldü.'));
}));

router.post('/encryption/key-recovery', asyncHandler(async (req: Request, res: Response) => {
  const { userId, recoveryMethod, recoveryData } = req.body;
  if (!userId || !recoveryMethod || !recoveryData) {
    throw new InvalidArgumentError('Kullanıcı kimliği, kurtarma metodu veya kurtarma verisi eksik.');
  }
  const result = await keyRecoveryService.recoverUserKey(userId, recoveryMethod, recoveryData);
  res.status(200).json(successResponse(result, 'Anahtar başarıyla kurtarıldı.'));
}));

// Goal API rotası: Yeni bir hedef oluştur
router.post('/goals', asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, description, type, targetDuration, targetDailyDuration, targetWeeklyDuration, targetCount, currentCount, targetCriteria } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!title || !type) {
    throw new InvalidArgumentError('Gerekli alanlar eksik: başlık, tür.');
  }

  const newGoal = await GoalService.createGoal({ title, description, type, targetDuration, targetDailyDuration, targetWeeklyDuration, targetCount, currentCount, targetCriteria }, userId);
  res.status(201).json(successResponse(newGoal, 'Hedef başarıyla oluşturuldu.'));
}));

// Goal API rotası: Tüm hedefleri listele
router.get('/goals', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const goals = await GoalService.getAllGoals(userId);
  res.status(200).json(successResponse(goals));
}));

// Goal API rotası: Hedefi güncelle
router.put('/goals/:goalId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { goalId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!goalId || !updates) {
    throw new InvalidArgumentError('Hedef kimliği veya güncellemeler eksik.');
  }
  await GoalService.updateGoal(goalId, updates, userId);
  res.status(200).json(successResponse(null, 'Hedef başarıyla güncellendi.'));
}));

// Goal API rotası: Hedefi sil
router.delete('/goals/:goalId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { goalId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!goalId) {
    throw new InvalidArgumentError('Hedef kimliği eksik.');
  }
  await GoalService.deleteGoal(goalId, userId);
  res.status(200).json(successResponse(null, 'Hedef başarıyla silindi.'));
}));

// Goal Management API rotaları
router.post('/goal-management', asyncHandler(async (req: Request, res: Response) => {
  const { userId, goalData } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!goalData || !goalData.title) {
    throw new InvalidArgumentError('Hedef verileri eksik: başlık.');
  }
  const newGoal = await GoalService.createGoal(goalData, userId);
  res.status(201).json(successResponse(newGoal, 'Hedef başarıyla oluşturuldu.'));
}));

router.get('/goal-management', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const goals = await GoalService.getAllGoals(userId);
  res.status(200).json(successResponse(goals));
}));

router.get('/goal-management/:goalId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { goalId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!goalId) {
    throw new InvalidArgumentError('Hedef kimliği eksik.');
  }
  const goal = await GoalService.getGoal(goalId, userId);
  if (!goal) {
    throw new NotFoundError('Hedef bulunamadı.');
  }
  res.status(200).json(successResponse(goal));
}));

router.put('/goal-management/:goalId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { goalId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!goalId || !updates) {
    throw new InvalidArgumentError('Hedef kimliği veya güncellemeler eksik.');
  }
  await GoalService.updateGoal(goalId, updates, userId);
  res.status(200).json(successResponse(null, 'Hedef başarıyla güncellendi.'));
}));

router.delete('/goal-management/:goalId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { goalId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!goalId) {
    throw new InvalidArgumentError('Hedef kimliği eksik.');
  }
  await GoalService.deleteGoal(goalId, userId);
  res.status(200).json(successResponse(null, 'Hedef başarıyla silindi.'));
}));


// AI Insight API rotaları
router.post('/ai-insights/generate', asyncHandler(async (req: Request, res: Response) => {
  const { userId, startDate, endDate } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!startDate || !endDate) {
    throw new InvalidArgumentError('Başlangıç ve bitiş tarihleri eksik.');
  }
  const insights = await aiInsightService.generateInsights(userId, startDate, endDate);
  res.status(200).json(successResponse(insights, 'Yapay zeka içgörüleri başarıyla oluşturuldu.'));
}));

// AI Notification API rotaları
router.post('/ai-notifications/send-recommendation', asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, body } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!title || !body) {
    throw new InvalidArgumentError('Başlık ve gövde eksik.');
  }
  await aiNotificationService.sendAIRecommendationNotification(userId, title, body);
  res.status(200).json(successResponse(null, 'Yapay zeka bildirimi başarıyla gönderildi.'));
}));

// Anomaly Detection API rotaları
router.post('/anomaly-detection/detect', asyncHandler(async (req: Request, res: Response) => {
  const { userId, dailyTotals } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!dailyTotals || !Array.isArray(dailyTotals)) {
    throw new InvalidArgumentError('Günlük toplamlar eksik veya geçersiz formatta.');
  }
  const anomalies = await anomalyDetectionService.detectAnomalies(dailyTotals);
  res.status(200).json(successResponse(anomalies, 'Anomaliler başarıyla tespit edildi.'));
}));

router.get('/anomaly-detection/alerts', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const alerts = await anomalyDetectionService.getAnomalyAlerts(userId);
  res.status(200).json(successResponse(alerts));
}));

// Auto Categorization API rotaları
router.post('/auto-categorization/categorize', asyncHandler(async (req: Request, res: Response) => {
  const { userId, events } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!events || !Array.isArray(events)) {
    throw new InvalidArgumentError('Etkinlikler eksik veya geçersiz formatta.');
  }
  const categorizedEvents = await autoCategorizationService.categorizeEvents(events);
  res.status(200).json(successResponse(categorizedEvents, 'Etkinlikler başarıyla kategorize edildi.'));
}));

// Automatic Event API rotaları
router.post('/automatic-events/create', asyncHandler(async (req: Request, res: Response) => {
  const { userId, startDate, endDate } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!startDate || !endDate) {
    throw new InvalidArgumentError('Başlangıç ve bitiş tarihleri eksik.');
  }
  const createdEvents = await automaticEventCreationService.createEventsFromActivityPatterns(userId, startDate, endDate);
  res.status(200).json(successResponse(createdEvents, 'Otomatik etkinlikler başarıyla oluşturuldu. (Simüle edildi)'));
}));

// Automation Rule API rotaları:
router.post('/automation-rules', asyncHandler(async (req: Request, res: Response) => {
  const { userId, ruleData } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!ruleData || !ruleData.name || !ruleData.trigger || !ruleData.action) {
    throw new InvalidArgumentError('Kural verileri eksik: isim, tetikleyici, eylem.');
  }

  const validTriggerTypes = ['time_spent', 'schedule', 'app_opened', 'category_time', 'idle_time', 'focus_mode_change'];
  if (!validTriggerTypes.includes(ruleData.trigger.type)) {
    throw new InvalidArgumentError(`Geçersiz tetikleyici türü: ${ruleData.trigger.type}. Kabul edilen türler: ${validTriggerTypes.join(', ')}`);
  }

  const ruleId = await automationRuleService.createRule(userId, ruleData);
  res.status(201).json(successResponse({ ruleId }, 'Otomasyon kuralı başarıyla oluşturuldu.'));
}));

router.get('/automation-rules', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const rules = await automationRuleService.getAllRules(userId);
  res.status(200).json(successResponse(rules));
}));

router.get('/automation-rules/:ruleId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { ruleId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!ruleId) {
    throw new InvalidArgumentError('Kural kimliği eksik.');
  }
  const rule = await automationRuleService.getRule(userId, ruleId);
  if (!rule) {
    throw new NotFoundError('Otomasyon kuralı bulunamadı.');
  }
  res.status(200).json(successResponse(rule));
}));

router.put('/automation-rules/:ruleId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { ruleId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!ruleId || !updates) {
    throw new InvalidArgumentError('Kural kimliği veya güncellemeler eksik.');
  }
  await automationRuleService.updateRule(userId, ruleId, updates);
  res.status(200).json(successResponse(null, 'Otomasyon kuralı başarıyla güncellendi.'));
}));

router.delete('/automation-rules/:ruleId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { ruleId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!ruleId) {
    throw new InvalidArgumentError('Kural kimliği eksik.');
  }
  await automationRuleService.deleteRule(userId, ruleId);
  res.status(200).json(successResponse(null, 'Otomasyon kuralı başarıyla silindi.'));
}));

// Behavioral Analysis API rotaları
router.post('/behavioral-analysis/realtime-pattern', asyncHandler(async (req: Request, res: Response) => {
  const { userId, activityEvent } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!activityEvent) {
    throw new InvalidArgumentError('Aktivite verileri eksik.');
  }
  const result = await behavioralAnalysisService.analyzeRealtimeBehavioralPattern(userId, activityEvent);
  res.status(200).json(successResponse(result, 'Davranışsal analiz başarıyla gerçekleştirildi.'));
}));

// Community Rules API rotaları
router.post('/community-rules/match', asyncHandler(async (req: Request, res: Response) => {
  const { event, communityRules } = req.body;
  if (!event || !communityRules || !Array.isArray(communityRules)) {
    throw new InvalidArgumentError('Etkinlik veya topluluk kuralları eksik/geçersiz.');
  }
  const matchedRules = await communityRulesService.matchCommunityRule(event, communityRules);
  res.status(200).json(successResponse(matchedRules, 'Topluluk kuralları başarıyla eşleştirildi.'));
}));

// Contextual Categorization API rotaları
router.post('/contextual-categorization/categorize', asyncHandler(async (req: Request, res: Response) => {
  const { userId, events } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!events || !Array.isArray(events)) {
    throw new InvalidArgumentError('Etkinlikler eksik veya geçersiz formatta.');
  }
  // Etkinlikleri JSON string'e dönüştürerek context olarak gönderiyoruz
  const categorizedEvents = await contextualCategorizationService.categorizeContext({ 
    context: JSON.stringify(events) 
  });
  res.status(200).json(successResponse(categorizedEvents, 'Etkinlikler bağlamsal olarak başarıyla kategorize edildi.'));
}));

router.get('/custom-contextual-rules', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const rules = await customContextualRulesService.getRules(userId);
  res.status(200).json(successResponse(rules));
}));

router.post('/custom-contextual-rules', asyncHandler(async (req: Request, res: Response) => {
  const { userId, ruleData } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!ruleData || !ruleData.pattern || !ruleData.category) {
    throw new InvalidArgumentError('Kural verileri eksik: desen, kategori.');
  }
  const newRule = await customContextualRulesService.createRule(userId, ruleData);
  res.status(201).json(successResponse(newRule, 'Özel bağlamsal kural başarıyla oluşturuldu.'));
}));

router.put('/custom-contextual-rules/:ruleId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { ruleId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!ruleId || !updates) {
    throw new InvalidArgumentError('Kural kimliği veya güncellemeler eksik.');
  }
  await customContextualRulesService.updateRule(ruleId, updates);
  res.status(200).json(successResponse(null, 'Özel bağlamsal kural başarıyla güncellendi.'));
}));

router.delete('/custom-contextual-rules/:ruleId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { ruleId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!ruleId) {
    throw new InvalidArgumentError('Kural kimliği eksik.');
  }
  await customContextualRulesService.deleteRule(userId, ruleId);
  res.status(200).json(successResponse(null, 'Özel bağlamsal kural başarıyla silindi.'));
}));

// Custom Event API rotaları
router.post('/custom-events', asyncHandler(async (req: Request, res: Response) => {
  const { userId, eventData } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!eventData || !eventData.name || !eventData.timestamp) {
    throw new InvalidArgumentError('Etkinlik verileri eksik: isim, zaman damgası.');
  }
  const newEvent = await customEventService.createCustomEvent(userId, eventData);
  res.status(201).json(successResponse(newEvent, 'Özel etkinlik başarıyla oluşturuldu.'));
}));

router.get('/custom-events', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const events = await customEventService.listCustomEvents(userId);
  res.status(200).json(successResponse(events));
}));

router.get('/custom-events/:eventId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { eventId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!eventId) {
    throw new InvalidArgumentError('Etkinlik kimliği eksik.');
  }
  const event = await customEventService.getCustomEvent(userId, eventId);
  if (!event) {
    throw new NotFoundError('Özel etkinlik bulunamadı.');
  }
  res.status(200).json(successResponse(event));
}));

router.put('/custom-events/:eventId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { eventId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!eventId || !updates) {
    throw new InvalidArgumentError('Etkinlik kimliği veya güncellemeler eksik.');
  }
  const updatedEvent = await customEventService.updateCustomEvent(userId, eventId, updates);
  if (!updatedEvent) {
    throw new NotFoundError('Güncellenecek özel etkinlik bulunamadı.');
  }
  res.status(200).json(successResponse(updatedEvent, 'Özel etkinlik başarıyla güncellendi.'));
}));

router.delete('/custom-events/:eventId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { eventId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!eventId) {
    throw new InvalidArgumentError('Etkinlik kimliği eksik.');
  }
  const success = await customEventService.deleteCustomEvent(userId, eventId);
  if (!success) {
    throw new NotFoundError('Silinecek özel etkinlik bulunamadı.');
  }
  res.status(200).json(successResponse(null, 'Özel etkinlik başarıyla silindi.'));
}));

// Focus Mode API rotası: Yeni odaklanma modu oluştur
router.post('/focus-modes', asyncHandler(async (req: Request, res: Response) => {
  const { userId, name, description, configuration } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!name || !configuration) {
    throw new InvalidArgumentError('Gerekli alanlar eksik: isim, konfigürasyon.');
  }
  const newMode = await focusModeService.createFocusMode(userId, { name, description, configuration });
  res.status(201).json(successResponse(newMode, 'Odaklanma modu başarıyla oluşturuldu.'));
}));

// Focus Mode API rotası: Belirli bir odaklanma modunu getir
router.get('/focus-modes/:modeId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { modeId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!modeId) {
    throw new InvalidArgumentError('Mod kimliği eksik.');
  }
  const mode = await focusModeService.getFocusMode(userId, modeId);
  if (!mode) {
    throw new NotFoundError('Odaklanma modu bulunamadı.');
  }
  res.status(200).json(successResponse(mode));
}));

// Focus Mode API rotası: Odaklanma modunu güncelle
router.put('/focus-modes/:modeId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  const { modeId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!modeId || !updates) {
    throw new InvalidArgumentError('Mod kimliği veya güncellemeler eksik.');
  }
  const updatedMode = await focusModeService.updateFocusMode(userId, modeId, updates);
  if (!updatedMode) {
    throw new NotFoundError('Güncellenecek odaklanma modu bulunamadı.');
  }
  res.status(200).json(successResponse(updatedMode, 'Odaklanma modu başarıyla güncellendi.'));
}));

router.delete('/focus-modes/:modeId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { modeId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!modeId) {
    throw new InvalidArgumentError('Mod kimliği eksik.');
  }
  const success = await focusModeService.deleteFocusMode(userId, modeId);
  if (!success) {
    throw new NotFoundError('Silinecek odaklanma modu bulunamadı.');
  }
  res.status(200).json(successResponse(null, 'Odaklanma modu başarıyla silindi.'));
}));

// Focus Mode API rotası: Tüm odaklanma modlarını listele
router.get('/focus-modes', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  const modes = await focusModeService.listFocusModes(userId);
  res.status(200).json(successResponse(modes));
}));

router.post('/focus-modes/:modeId/set-active', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { modeId } = req.params;
  if (!userId) {
    throw new UnauthorizedError('Kullanıcı kimliği doğrulanmamış.');
  }
  if (!modeId) {
    throw new InvalidArgumentError('Mod kimliği eksik.');
  }
  const activeMode = await focusModeService.setActiveFocusMode(userId, modeId);
  if (!activeMode) {
    throw new NotFoundError('Aktif edilecek odaklanma modu bulunamadı.');
  }
  res.status(200).json(successResponse(activeMode, 'Odaklanma modu başarıyla aktif edildi.'));
}));

// Feedback API rotası
router.post('/feedback', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Gerçek kullanıcı kimliği alınmalı, şu an için sabit bir değer kullanıldı
  const userId = req.user?.uid || 'anonymous'; 
  const { subject, message } = req.body;

  if (!subject || !message) {
    throw new InvalidArgumentError('Geri bildirim konusu ve mesajı eksik.');
  }

  const result = await feedbackService.submitFeedback(userId, { subject, message });
  res.status(201).json(successResponse(result, 'Geri bildiriminiz başarıyla gönderildi.'));
}));

export default router; 