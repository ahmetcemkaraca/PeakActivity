import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ContextualCategorizationService } from '../services/contextual-categorization-service';
import { CustomContextualRulesService } from '../services/custom-contextual-rules-service';

const contextualCategorizationService = new ContextualCategorizationService();
const customContextualRulesService = new CustomContextualRulesService();

export const categorizeContext = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { context: textContext, language } = request.data;

  if (typeof textContext !== 'string' || textContext.trim() === '') {
    throw new HttpsError('invalid-argument', "The 'context' must be a non-empty string.");
  }
  // Dil parametresi isteğe bağlı olduğundan, burada zorunlu kontrol yapmıyoruz.

  try {
    const result = contextualCategorizationService.categorizeContext({
      context: textContext,
      language,
    });
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});

// Yeni özel bağlamsal kurallar API fonksiyonları

export const getCustomContextualRules = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  try {
    const rules = await customContextualRulesService.getRules(request.auth.uid);
    return { status: 'success', data: rules };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});

export const createCustomContextualRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const ruleData = request.data;
  if (
    !ruleData ||
    !ruleData.name ||
    !ruleData.contextPattern ||
    !ruleData.category ||
    typeof ruleData.confidence !== 'number'
  ) {
    throw new HttpsError('invalid-argument', 'Geçersiz kural verisi sağlandı.');
  }

  try {
    const newRule = await customContextualRulesService.createRule(request.auth.uid, ruleData);
    return { status: 'success', data: newRule };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});

export const updateCustomContextualRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const ruleData = request.data;
  if (!ruleData || !ruleData.id) {
    throw new HttpsError('invalid-argument', "Güncellenecek kural ve ID'si sağlanmadı.");
  }

  try {
    await customContextualRulesService.updateRule(request.auth.uid, ruleData);
    return { status: 'success' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});

export const deleteCustomContextualRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { id: ruleId } = request.data;
  if (!ruleId) {
    throw new HttpsError('invalid-argument', "Silinecek kural ID'si sağlanmadı.");
  }

  try {
    await customContextualRulesService.deleteRule(request.auth.uid, ruleId);
    return { status: 'success' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});
