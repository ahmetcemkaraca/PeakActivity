import * as functions from 'firebase-functions';
import { db } from '../firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

interface ContextualRule {
  id?: string;
  name: string;
  contextPattern: string;
  category: string;
  confidence: number;
}

export class CustomContextualRulesService {
  private collection = db.collection('customContextualRules');

  /**
   * Fetches all custom contextual rules for the authenticated user.
   * @param uid The user ID.
   * @returns An array of custom contextual rules.
   */
  public async getRules(uid: string): Promise<ContextualRule[]> {
    const snapshot = await this.collection.where('userId', '==', uid).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ContextualRule[];
  }

  /**
   * Creates a new custom contextual rule for the authenticated user.
   * @param uid The user ID.
   * @param ruleData The data for the new rule.
   * @returns The created rule with its ID.
   */
  public async createRule(uid: string, ruleData: ContextualRule): Promise<ContextualRule> {
    const docRef = await this.collection.add({
      ...ruleData,
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as ContextualRule;
  }

  /**
   * Updates an existing custom contextual rule.
   * @param uid The user ID.
   * @param ruleId The ID of the rule to update.
   * @param updates The updates to apply to the rule.
   */
  public async updateRule(uid: string, ruleData: ContextualRule): Promise<void> {
    if (!ruleData.id) {
      throw new Error("Kural ID'si sağlanmadı.");
    }
    const docRef = this.collection.doc(ruleData.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== uid) {
      throw new Error('Kural bulunamadı veya bu kuralı güncelleme yetkiniz yok.');
    }

    await docRef.update({
      name: ruleData.name,
      contextPattern: ruleData.contextPattern,
      category: ruleData.category,
      confidence: ruleData.confidence,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Deletes a custom contextual rule.
   * @param uid The user ID.
   * @param ruleId The ID of the rule to delete.
   */
  public async deleteRule(uid: string, ruleId: string): Promise<void> {
    const docRef = this.collection.doc(ruleId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== uid) {
      throw new Error('Kural bulunamadı veya bu kuralı silme yetkiniz yok.');
    }

    await docRef.delete();
  }
}
