import { logger } from 'firebase-functions';
import { db } from '../firebaseAdmin';
import { ActivityService } from './activity-service';
import { AINotificationService } from './ai-notification-service';

interface AutomationRuleDocument {
  id: string; // Document ID
  user_id: string; // User ID
  name: string; // Rule name
  description?: string; // Optional description
  is_active: boolean; // Whether the rule is currently active
  priority: number; // Rule priority (higher value = higher priority)

  // Trigger definition
  trigger: {
    type:
      | 'time_spent'
      | 'schedule'
      | 'app_opened'
      | 'category_time'
      | 'idle_time'
      | 'focus_mode_change';
    threshold_seconds?: number;
    app_names?: string[];
    categories?: string[];
    cron_expression?: string;
    target_app_name?: string;
    target_category?: string;
    threshold_minutes?: number;
    idle_threshold_seconds?: number;
    from_mode?: string;
    to_mode?: string;
    conditions?: Array<{
      field: string;
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
      value: any;
    }>;
  };

  // Action definition
  action: {
    type:
      | 'show_notification'
      | 'block_app'
      | 'suggest_break'
      | 'switch_focus_mode'
      | 'log_mood'
      | 'context_prompt';
    title?: string;
    message?: string;
    app_to_block?: string;
    duration_minutes?: number;
    break_duration_minutes?: number;
    target_focus_mode?: string;
    mood_options?: string[];
    prompt_text?: string;
  };

  cooldown_seconds?: number;
  last_triggered_at?: number;

  created_at: number;
  updated_at: number;
  version: number;
}

export class AutomationRuleService {
  private firestore = db;
  private activityService: ActivityService;
  private aiNotificationService: AINotificationService;

  constructor() {
    this.activityService = new ActivityService();
    this.aiNotificationService = new AINotificationService();
  }

  /**
   * Yeni bir otomasyon kuralı oluşturur.
   * @param userId Kuralı oluşturan kullanıcının ID'si.
   * @param ruleData Oluşturulacak kuralın verisi.
   * @returns Oluşturulan kuralın ID'si.
   */
  public async createRule(
    userId: string,
    ruleData: Omit<
      AutomationRuleDocument,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'
    >
  ): Promise<string> {
    const now = Date.now();
    const ruleRef = await this.firestore.collection(`users/${userId}/automation_rules`).add({
      ...ruleData,
      user_id: userId,
      is_active: ruleData.is_active !== undefined ? ruleData.is_active : true, // Varsayılan olarak aktif
      priority: ruleData.priority !== undefined ? ruleData.priority : 0, // Varsayılan öncelik
      created_at: now,
      updated_at: now,
      version: 1,
    });
    return ruleRef.id;
  }

  /**
   * Belirli bir otomasyon kuralını ID'sine göre getirir.
   * @param userId Kuralın ait olduğu kullanıcının ID'si.
   * @param ruleId Getirilecek kuralın ID'si.
   * @returns Kural belgesi veya null.
   */
  public async getRule(userId: string, ruleId: string): Promise<AutomationRuleDocument | null> {
    const ruleDoc = await this.firestore
      .collection(`users/${userId}/automation_rules`)
      .doc(ruleId)
      .get();
    if (!ruleDoc.exists) {
      return null;
    }
    return { id: ruleDoc.id, ...ruleDoc.data() } as AutomationRuleDocument;
  }

  /**
   * Bir kullanıcının tüm otomasyon kurallarını getirir.
   * @param userId Kullanıcının ID'si.
   * @returns Kural belgeleri dizisi.
   */
  public async getAllRules(userId: string): Promise<AutomationRuleDocument[]> {
    const snapshot = await this.firestore.collection(`users/${userId}/automation_rules`).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AutomationRuleDocument[];
  }

  /**
   * Bir otomasyon kuralını günceller.
   * @param userId Kuralın ait olduğu kullanıcının ID'si.
   * @param ruleId Güncellenecek kuralın ID'si.
   * @param updates Güncellenecek kural verileri.
   */
  public async updateRule(
    userId: string,
    ruleId: string,
    updates: Partial<Omit<AutomationRuleDocument, 'id' | 'user_id' | 'created_at'>>
  ): Promise<void> {
    const now = Date.now();
    await this.firestore
      .collection(`users/${userId}/automation_rules`)
      .doc(ruleId)
      .update({
        ...updates,
        updated_at: now,
      });
  }

  /**
   * Bir otomasyon kuralını siler.
   * @param userId Kuralın ait olduğu kullanıcının ID'si.
   * @param ruleId Silinecek kuralın ID'si.
   */
  public async deleteRule(userId: string, ruleId: string): Promise<void> {
    await this.firestore.collection(`users/${userId}/automation_rules`).doc(ruleId).delete();
  }

  /**
   * Bir kuralın koşullarının karşılanıp karşılanmadığını değerlendirir.
   * Bu metod, karmaşık koşul değerlendirme mantığını içerecektir.
   * Şimdilik sadece basit bir yer tutucudur.
   * @param rule Kural belgesi.
   * @param currentContext Mevcut bağlam (örneğin, aktivite verileri, zaman).
   * @returns Koşullar karşılanıyorsa true, aksi takdirde false.
   */
  public async evaluateRuleConditions(
    rule: AutomationRuleDocument,
    currentContext: any
  ): Promise<boolean> {
    // TODO: Gerçek koşul değerlendirme mantığını buraya ekle
    // Örnek: currentContext.time_spent > rule.trigger.threshold_seconds
    logger.log(`Kural '${rule.name}' için koşullar değerlendiriliyor.`);
    // Basit bir örnek koşul: Kural aktifse ve cooldown süresi dolmuşsa true döndür.
    const now = Date.now();
    if (!rule.is_active) {
      return false;
    }
    if (
      rule.cooldown_seconds &&
      rule.last_triggered_at &&
      now - rule.last_triggered_at < rule.cooldown_seconds * 1000
    ) {
      logger.log(`Kural '${rule.name}' cooldown süresinde.`);
      return false;
    }

    // Daha detaylı koşullar için 'conditions' dizisi işlenecek
    if (rule.trigger.conditions && rule.trigger.conditions.length > 0) {
      for (const condition of rule.trigger.conditions) {
        const fieldValue = currentContext[condition.field];
        if (fieldValue === undefined) {
          logger.warn(`Koşul değerlendirme hatası: Alan '${condition.field}' bağlamda bulunamadı.`);
          return false; // Alan bağlamda yoksa koşul karşılanmaz.
        }

        switch (condition.operator) {
          case 'eq':
            if (fieldValue !== condition.value) return false;
            break;
          case 'neq':
            if (fieldValue === condition.value) return false;
            break;
          case 'gt':
            if (fieldValue <= condition.value) return false;
            break;
          case 'lt':
            if (fieldValue >= condition.value) return false;
            break;
          case 'gte':
            if (fieldValue < condition.value) return false;
            break;
          case 'lte':
            if (fieldValue > condition.value) return false;
            break;
          case 'contains':
            if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
              if (!fieldValue.includes(condition.value)) return false;
            } else if (Array.isArray(fieldValue) && typeof condition.value === 'string') {
              if (!fieldValue.includes(condition.value)) return false;
            } else {
              logger.warn(
                `'contains' operatörü için geçersiz türler: fieldValue: ${typeof fieldValue}, value: ${typeof condition.value}`
              );
              return false;
            }
            break;
          default:
            logger.warn(`Bilinmeyen operatör: ${condition.operator}`);
            return false;
        }
      }
    }

    return true; // Tüm koşullar karşılanırsa true
  }

  /**
   * Bir kuralın eylemini gerçekleştirir.
   * Bu metod, sistem bildirimleri, uygulama kontrolü vb. için Firebase Cloud Functions
   * dışındaki sistemlerle entegrasyon gerektirecektir (örn: Tauri uygulamasına bildirim gönderme).
   * Şimdilik sadece bir log mesajı ile eylemi simüle eder.
   * @param rule Kural belgesi.
   */
  public async executeRuleAction(rule: AutomationRuleDocument): Promise<void> {
    logger.log(`Kural '${rule.name}' eylemi gerçekleştiriliyor: ${rule.action.type}`);

    switch (rule.action.type) {
      case 'show_notification':
        if (rule.action.title && rule.action.message) {
          await this.aiNotificationService.sendAIRecommendationNotification(
            rule.user_id,
            rule.action.title,
            rule.action.message,
            { ruleId: rule.id, actionType: rule.action.type }
          );
          logger.log(`Bildirim gönderildi: ${rule.action.title} - ${rule.action.message}`);
        }
        break;
      case 'block_app':
        logger.log(
          `Uygulama engelleme eylemi tetiklendi: ${rule.action.app_to_block || 'Belirtilmedi'}. (İstemci tarafında işlenmesi gerekiyor)`
        );
        // İstemci uygulamasına bildirim veya bir mesaj gönderilebilir
        await this.aiNotificationService.sendAIRecommendationNotification(
          rule.user_id,
          'Uygulama Engelleme Uyarısı',
          `${rule.action.app_to_block} uygulaması engelleniyor.`, // Veya daha detaylı bir mesaj
          {
            ruleId: rule.id,
            actionType: rule.action.type,
            appToBlock: rule.action.app_to_block || '',
          }
        );
        break;
      case 'suggest_break':
        logger.log(
          `Mola önerme eylemi tetiklendi: ${rule.action.break_duration_minutes || 'Belirtilmedi'} dakika. (İstemci tarafında işlenmesi gerekiyor)`
        );
        await this.aiNotificationService.sendAIRecommendationNotification(
          rule.user_id,
          'Mola Zamanı',
          `Kısa bir ${rule.action.break_duration_minutes || ''} dakikalık mola vermeniz önerilir.`, // Veya daha detaylı bir mesaj
          {
            ruleId: rule.id,
            actionType: rule.action.type,
            breakDuration: rule.action.break_duration_minutes?.toString() || '',
          }
        );
        break;
      case 'switch_focus_mode':
        logger.log(
          `Odak modu değiştirme eylemi tetiklendi: ${rule.action.target_focus_mode || 'Belirtilmedi'}. (İstemci tarafında işlenmesi gerekiyor)`
        );
        await this.aiNotificationService.sendAIRecommendationNotification(
          rule.user_id,
          'Odak Modu Değişikliği',
          `Odak modu ${rule.action.target_focus_mode || ''} olarak değiştiriliyor.`, // Veya daha detaylı bir mesaj
          {
            ruleId: rule.id,
            actionType: rule.action.type,
            targetFocusMode: rule.action.target_focus_mode || '',
          }
        );
        break;
      case 'log_mood':
        logger.log(
          `Ruh hali kaydetme eylemi tetiklendi. (İstemci tarafında kullanıcıdan girdi bekleniyor)`
        );
        await this.aiNotificationService.sendAIRecommendationNotification(
          rule.user_id,
          'Ruh Halinizi Kaydedin',
          'Güncel ruh halinizi kaydetmek ister misiniz?',
          { ruleId: rule.id, actionType: rule.action.type }
        );
        break;
      case 'context_prompt':
        logger.log(
          `Bağlam istemi eylemi tetiklendi: ${rule.action.prompt_text || 'Belirtilmedi'}. (İstemci tarafında işlenmesi gerekiyor)`
        );
        await this.aiNotificationService.sendAIRecommendationNotification(
          rule.user_id,
          'Bağlamsal Bilgilendirme',
          rule.action.prompt_text || 'Bir mesajınız var.',
          {
            ruleId: rule.id,
            actionType: rule.action.type,
            promptText: rule.action.prompt_text || '',
          }
        );
        break;
      default:
        logger.warn(`Bilinmeyen eylem tipi: ${rule.action.type}`);
        break;
    }

    // Eylem tamamlandıktan sonra last_triggered_at güncelle
    await this.firestore.collection(`users/${rule.user_id}/automation_rules`).doc(rule.id).update({
      last_triggered_at: Date.now(),
    });
  }
}
