import { db } from '../firebaseAdmin';

interface GoalDocument {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  category: string[];
  created_at: number;
  updated_at: number;
  version: number;
}

export class GoalManagementService {
  /**
   * Yeni bir hedef oluşturur.
   * @param userId Hedefi oluşturan kullanıcının ID'si.
   * @param goalData Yeni hedefin verileri.
   * @returns Oluşturulan hedef belgesi.
   */
  async createGoal(
    userId: string,
    goalData: Omit<GoalDocument, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<GoalDocument> {
    const newGoalRef = db.collection(`users/${userId}/goals`).doc();
    const timestamp = Date.now();
    const goal: GoalDocument = {
      id: newGoalRef.id,
      user_id: userId,
      ...goalData,
      created_at: timestamp,
      updated_at: timestamp,
      version: 1,
    };
    await newGoalRef.set(goal);
    return goal;
  }

  /**
   * Belirli bir hedefi getirir.
   * @param userId Kullanıcının ID'si.
   * @param goalId Hedefin ID'si.
   * @returns Hedef belgesi veya bulunamazsa null.
   */
  async getGoal(userId: string, goalId: string): Promise<GoalDocument | null> {
    const goalDoc = await db.collection(`users/${userId}/goals`).doc(goalId).get();
    if (!goalDoc.exists) {
      return null;
    }
    return goalDoc.data() as GoalDocument;
  }

  /**
   * Bir hedefi günceller.
   * @param userId Kullanıcının ID'si.
   * @param goalId Hedefin ID'si.
   * @param updates Güncellenecek alanlar.
   * @returns Güncellenen hedef belgesi veya bulunamazsa null.
   */
  async updateGoal(
    userId: string,
    goalId: string,
    updates: Partial<Omit<GoalDocument, 'id' | 'user_id' | 'created_at' | 'version'>>
  ): Promise<GoalDocument | null> {
    const goalRef = db.collection(`users/${userId}/goals`).doc(goalId);
    const timestamp = Date.now();
    await goalRef.update({
      ...updates,
      updated_at: timestamp,
    });
    const updatedDoc = await goalRef.get();
    if (!updatedDoc.exists) {
      return null;
    }
    return updatedDoc.data() as GoalDocument;
  }

  /**
   * Bir hedefi siler.
   * @param userId Kullanıcının ID'si.
   * @param goalId Hedefin ID'si.
   * @returns Hedef silindiyse true, aksi takdirde false.
   */
  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    const goalRef = db.collection(`users/${userId}/goals`).doc(goalId);
    await goalRef.delete();
    const doc = await goalRef.get();
    return !doc.exists;
  }

  /**
   * Tüm hedefleri listeler.
   * @param userId Kullanıcının ID'si.
   * @returns Hedef belgelerinin bir dizisi.
   */
  async listGoals(userId: string): Promise<GoalDocument[]> {
    const snapshot = await db.collection(`users/${userId}/goals`).get();
    return snapshot.docs.map(doc => doc.data() as GoalDocument);
  }
}
