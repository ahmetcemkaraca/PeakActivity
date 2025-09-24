import { db } from "../firebaseAdmin";
import { logger } from 'firebase-functions';
import { 
  FirestoreError, 
  ValidationError, 
  NotFoundError, 
  handleError, 
  validateRequired,
  validateType 
} from '../utils/errorHandler';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'time_based' | 'count_based' | 'habit_based' | 'milestone_based';
  targetDuration?: number; // seconds
  targetDailyDuration?: number; // seconds
  targetWeeklyDuration?: number; // seconds
  targetCount?: number;
  currentCount?: number;
  targetCriteria: {
    appNames?: string[];
    categories?: string[];
    tags?: string[];
  };
  progress: {
    currentDuration: number; // seconds
    currentStreak: number; // days
    longestStreak: number; // days
    lastUpdated: number; // timestamp
  };
  createdAt: number;
  updatedAt: number;
  version: number;
}

export class GoalService {
  /**
   * Yeni bir hedef oluşturur
   */
  static async createGoal(goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version' | 'progress'>, userId: string): Promise<Goal> {
    try {
      validateRequired(userId, 'userId');
      validateRequired(goalData, 'goalData');
      validateRequired(goalData.title, 'goalData.title');
      validateType(goalData.title, 'string', 'goalData.title');
      
      if (!['time_based', 'count_based', 'habit_based', 'milestone_based'].includes(goalData.type)) {
        throw new ValidationError('Invalid goal type', 'goalData.type', goalData.type);
      }

      logger.info(`Creating goal for user ${userId}: ${goalData.title}`);

      const newGoalRef = db.collection('users').doc(userId).collection('goals').doc();
      const newGoal: Goal = {
        id: newGoalRef.id,
        userId,
        ...goalData,
        progress: {
          currentDuration: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastUpdated: Date.now(),
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };

      await newGoalRef.set(newGoal);
      logger.info(`Goal created successfully with ID: ${newGoal.id}`);
      return newGoal;
    } catch (error: any) {
      if (error.code?.startsWith('firestore/')) {
        throw new FirestoreError('create goal', error);
      }
      handleError(error, 'GoalService.createGoal');
    }
  }

  /**
   * Bir hedefi ID'sine göre getirir
   */
  static async getGoal(goalId: string, userId: string): Promise<Goal | null> {
    try {
      validateRequired(goalId, 'goalId');
      validateRequired(userId, 'userId');
      validateType(goalId, 'string', 'goalId');
      validateType(userId, 'string', 'userId');

      logger.info(`Retrieving goal ${goalId} for user ${userId}`);

      const goalDoc = await db.collection('users').doc(userId).collection('goals').doc(goalId).get();
      if (!goalDoc.exists) {
        logger.warn(`Goal ${goalId} not found for user ${userId}`);
        return null;
      }
      
      const goal = goalDoc.data() as Goal;
      logger.info(`Goal ${goalId} retrieved successfully`);
      return goal;
    } catch (error: any) {
      if (error.code?.startsWith('firestore/')) {
        throw new FirestoreError('get goal', error);
      }
      handleError(error, 'GoalService.getGoal');
    }
  }

  /**
   * Bir hedefi günceller
   */
  static async updateGoal(goalId: string, updates: Partial<Goal>, userId: string): Promise<void> {
    try {
      const goalRef = db.collection('users').doc(userId).collection('goals').doc(goalId);
      await goalRef.update({ ...updates, updatedAt: Date.now() });
    } catch (error: any) {
      throw new Error(`Hedef güncellenirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Bir hedefi siler
   */
  static async deleteGoal(goalId: string, userId: string): Promise<void> {
    try {
      const goalRef = db.collection('users').doc(userId).collection('goals').doc(goalId);
      await goalRef.delete();
    } catch (error: any) {
      throw new Error(`Hedef silinirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Bir kullanıcının tüm hedeflerini getirir
   */
  static async getAllGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsSnapshot = await db.collection('users').doc(userId).collection('goals').get();
      return goalsSnapshot.docs.map(doc => doc.data() as Goal);
    } catch (error: any) {
      throw new Error(`Hedefler alınırken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Hedef ilerlemesini kontrol eder ve günceller
   * Bu metod, kullanıcının aktivitelerini işleyerek ilgili hedeflerin ilerlemesini günceller.
   * @param userId Aktivitenin ait olduğu kullanıcının Firebase UID'si.
   * @param activityData İşlenecek aktivite verisi (örneğin, ActivityService'den gelen veri).
   * @returns Güncellenen hedeflerin ID'lerini içeren bir dizi.
   */
  static async checkGoalProgress(userId: string, activityData: any): Promise<string[]> {
    try {
      console.log(`Checking goal progress for user ${userId} with activity: ${JSON.stringify(activityData)}`);

      const updatedGoalIds: string[] = [];
      const goalsSnapshot = await db.collection('users').doc(userId).collection('goals').get();
      const goals = goalsSnapshot.docs.map(doc => doc.data() as Goal);

      for (const goal of goals) {
        // Hedefin kriterleriyle aktiviteyi eşleştir
        const isMatch = (
          (!goal.targetCriteria.appNames || goal.targetCriteria.appNames.includes(activityData.app)) &&
          (!goal.targetCriteria.categories || goal.targetCriteria.categories.includes(activityData.category)) &&
          (!goal.targetCriteria.tags || goal.targetCriteria.tags.some((tag: string) => activityData.tags && activityData.tags.includes(tag)))
        );

        if (isMatch) {
          let updated = false;
          const currentTimestamp = Date.now();

          // İlerleme metriklerini güncelle
          if (activityData.duration_sec) {
            goal.progress.currentDuration = (goal.progress.currentDuration || 0) + activityData.duration_sec;
            updated = true;
          }
          if (activityData.count) { // Eğer aktivite bir sayı içeriyorsa (örn. tamamlanan görev sayısı)
            goal.currentCount = (goal.currentCount || 0) + activityData.count;
            updated = true;
          }

          // Streak (seri) yönetimi - basit bir günlük seri kontrolü
          const lastUpdatedDate = new Date(goal.progress.lastUpdated).toDateString();
          const activityDate = new Date(activityData.timestamp).toDateString();
          const yesterdayDate = new Date(currentTimestamp - 24 * 60 * 60 * 1000).toDateString();

          if (activityDate === lastUpdatedDate) {
            // Aynı gün içinde ek aktivite, seri etkilenmez
          } else if (activityDate === yesterdayDate) {
            // Dünden devam ediyor, seriyi artır
            goal.progress.currentStreak = (goal.progress.currentStreak || 0) + 1;
            updated = true;
          } else {
            // Seri kırıldı, sıfırla
            goal.progress.currentStreak = 1;
            updated = true;
          }
          goal.progress.longestStreak = Math.max(goal.progress.longestStreak || 0, goal.progress.currentStreak);
          goal.progress.lastUpdated = currentTimestamp;


          // Hedef türüne göre ek kontroller ve tamamlanma mantığı (basit örnekler)
          switch (goal.type) {
            case 'time_based':
              // Örneğin, targetDuration'a ulaşıldığında hedef tamamlanır
              break;
            case 'count_based':
              // Örneğin, targetCount'a ulaşıldığında hedef tamamlanır
              break;
            case 'habit_based':
              // Örneğin, belirli bir seriye ulaşıldığında hedef tamamlanır
              break;
            case 'milestone_based':
              // Bu tür genellikle manuel olarak güncellenir veya daha karmaşık bir mantık gerektirir.
              break;
          }

          if (updated) {
            await db.collection('users').doc(userId).collection('goals').doc(goal.id).update({
              progress: goal.progress,
              currentCount: goal.currentCount,
              updatedAt: currentTimestamp,
              version: (goal.version || 0) + 1,
            });
            updatedGoalIds.push(goal.id);
            console.log(`Goal ${goal.id} progress updated for user ${userId}.`);
          }
        }
      }
      return updatedGoalIds;
    } catch (error: any) {
      console.error(`Hedef ilerlemesi kontrol edilirken hata oluştu:`, error);
      throw new Error(`Hedef ilerlemesi kontrol edilirken hata oluştu: ${error.message}`);
    }
  }
} 