import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { authenticate } from '../firebaseAdmin';
import { GoalManagementService } from '../services/goal-management-service';

const goalManagementService = new GoalManagementService();

/**
 * Yeni bir hedef oluşturur.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const createGoal = onCall(async (request: CallableRequest) => {
  authenticate(request);

  const userId = request.auth!.uid;
  const { name, description, targetValue, currentValue, startDate, endDate, category } =
    request.data as {
      name: string;
      description?: string;
      targetValue: number;
      currentValue: number;
      startDate: number;
      endDate: number;
      category: string[];
    };

  if (!name || !targetValue || !startDate || !endDate || !category) {
    throw new HttpsError(
      'invalid-argument',
      'Hedef adı, hedef değeri, başlangıç tarihi, bitiş tarihi ve kategori gereklidir.'
    );
  }

  try {
    const newGoal = await goalManagementService.createGoal(userId, {
      name,
      description,
      targetValue,
      currentValue,
      startDate,
      endDate,
      category,
    });
    return { success: true, goal: newGoal };
  } catch (error: any) {
    throw new HttpsError('internal', 'Hedef oluşturulurken hata oluştu.', error.message);
  }
});

/**
 * Bir hedefi getirir.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const getGoal = onCall(async (request: CallableRequest) => {
  authenticate(request);

  const userId = request.auth!.uid;
  const { goalId } = request.data as { goalId: string };

  if (!goalId) {
    throw new HttpsError('invalid-argument', "Hedef ID'si gereklidir.");
  }

  try {
    const goal = await goalManagementService.getGoal(userId, goalId);
    return { success: true, goal };
  } catch (error: any) {
    throw new HttpsError('internal', 'Hedef getirilirken hata oluştu.', error.message);
  }
});

/**
 * Bir hedefi günceller.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const updateGoal = onCall(async (request: CallableRequest) => {
  authenticate(request);

  const userId = request.auth!.uid;
  const { goalId, updates } = request.data as { goalId: string; updates: any };

  if (!goalId || !updates) {
    throw new HttpsError('invalid-argument', "Hedef ID'si ve güncellemeler gereklidir.");
  }

  try {
    const updatedGoal = await goalManagementService.updateGoal(userId, goalId, updates);
    return { success: true, goal: updatedGoal };
  } catch (error: any) {
    throw new HttpsError('internal', 'Hedef güncellenirken hata oluştu.', error.message);
  }
});

/**
 * Bir hedefi siler.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const deleteGoal = onCall(async (request: CallableRequest) => {
  authenticate(request);

  const userId = request.auth!.uid;
  const { goalId } = request.data as { goalId: string };

  if (!goalId) {
    throw new HttpsError('invalid-argument', "Hedef ID'si gereklidir.");
  }

  try {
    await goalManagementService.deleteGoal(userId, goalId);
    return { success: true };
  } catch (error: any) {
    throw new HttpsError('internal', 'Hedef silinirken hata oluştu.', error.message);
  }
});

/**
 * Tüm hedefleri listeler.
 * Yetkilendirme: Kimliği doğrulanmış kullanıcı olmalı.
 */
export const listGoals = onCall(async (request: CallableRequest) => {
  authenticate(request);

  const userId = request.auth!.uid;

  try {
    const goals = await goalManagementService.listGoals(userId);
    return { success: true, goals };
  } catch (error: any) {
    throw new HttpsError('internal', 'Hedefler listelenirken hata oluştu.', error.message);
  }
});
