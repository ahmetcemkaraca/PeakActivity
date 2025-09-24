import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoalService } from '../services/goal-service';
import * as admin from 'firebase-admin';

// Hedef oluşturma
export const createGoal = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const {
    title,
    description,
    type,
    targetDuration,
    targetDailyDuration,
    targetWeeklyDuration,
    targetCount,
    currentCount,
    targetCriteria,
  } = request.data;
  const userId = request.auth.uid;

  if (!title || !type) {
    throw new HttpsError('invalid-argument', 'Gerekli alanlar eksik: başlık, tür.');
  }

  try {
    const newGoal = await GoalService.createGoal(
      {
        title,
        description,
        type,
        targetDuration,
        targetDailyDuration,
        targetWeeklyDuration,
        targetCount,
        currentCount,
        targetCriteria,
      },
      userId
    );
    return { status: 'success', data: newGoal };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});

export const listGoals = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = request.auth.uid;

  try {
    const goals = await GoalService.getAllGoals(userId);
    return { status: 'success', data: goals };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});

// Hedef güncelleme
export const updateGoal = onCall(async request => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
    }

    const userId = request.auth.uid;
    const { goalId, updates } = request.data;

    if (!goalId || !updates) {
      throw new HttpsError('invalid-argument', "Hedef ID'si ve güncellemeler gereklidir.");
    }

    await GoalService.updateGoal(goalId, updates, userId);
    return { success: true, message: 'Hedef başarıyla güncellendi' };
  } catch (error: any) {
    throw new HttpsError('internal', 'Hedef güncellenirken hata oluştu.', error.message);
  }
});

// Hedef silme
export const deleteGoal = onCall(async request => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmadı.');
    }

    const userId = request.auth.uid;
    const { goalId } = request.data;

    if (!goalId) {
      throw new HttpsError('invalid-argument', "Hedef ID'si gereklidir.");
    }

    await GoalService.deleteGoal(goalId, userId);
    return { success: true, message: 'Hedef başarıyla silindi' };
  } catch (error: any) {
    throw new HttpsError('internal', 'Hedef silinirken hata oluştu.', error.message);
  }
});
