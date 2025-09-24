import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { AutomationRuleService } from '../services/automation-rule-service';

const automationRuleService = new AutomationRuleService();

// Create Automation Rule
export const createAutomationRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = request.auth.uid;
  const { ruleData } = request.data;

  if (!ruleData || !ruleData.name || !ruleData.trigger || !ruleData.action) {
    throw new HttpsError('invalid-argument', 'Kural adı, tetikleyici ve eylem zorunludur.');
  }

  try {
    const ruleId = await automationRuleService.createRule(userId, ruleData);
    return { success: true, ruleId };
  } catch (error) {
    if (error instanceof Error) {
      throw new HttpsError('internal', 'Kural oluşturulurken hata oluştu.', error.message);
    } else {
      throw new HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Get Automation Rule by ID
export const getAutomationRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = request.auth.uid;
  const { ruleId } = request.data;

  if (!ruleId) {
    throw new HttpsError('invalid-argument', "Kural ID'si zorunludur.");
  }

  try {
    const rule = await automationRuleService.getRule(userId, ruleId);
    if (!rule) {
      throw new HttpsError('not-found', 'Kural bulunamadı.');
    }
    return { success: true, rule };
  } catch (error) {
    if (error instanceof Error) {
      throw new HttpsError('internal', 'Kural getirilirken hata oluştu.', error.message);
    } else {
      throw new HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Get All Automation Rules for a user
export const getAllAutomationRules = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = request.auth.uid;

  try {
    const rules = await automationRuleService.getAllRules(userId);
    return { success: true, rules };
  } catch (error) {
    if (error instanceof Error) {
      throw new HttpsError('internal', 'Kurallar getirilirken hata oluştu.', error.message);
    } else {
      throw new HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Update Automation Rule
export const updateAutomationRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = request.auth.uid;
  const { ruleId, updates } = request.data;

  if (!ruleId || !updates) {
    throw new HttpsError('invalid-argument', "Kural ID'si ve güncellemeler zorunludur.");
  }

  try {
    await automationRuleService.updateRule(userId, ruleId, updates);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw new HttpsError('internal', 'Kural güncellenirken hata oluştu.', error.message);
    } else {
      throw new HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});

// Delete Automation Rule
export const deleteAutomationRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
  }
  const userId = request.auth.uid;
  const { ruleId } = request.data;

  if (!ruleId) {
    throw new HttpsError('invalid-argument', "Kural ID'si zorunludur.");
  }

  try {
    await automationRuleService.deleteRule(userId, ruleId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      throw new HttpsError('internal', 'Kural silinirken hata oluştu.', error.message);
    } else {
      throw new HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});
