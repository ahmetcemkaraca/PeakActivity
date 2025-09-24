import { logger } from 'firebase-functions';
import { db } from '../firebaseAdmin';

interface ABTestConfig {
  testId: string;
  variants: string[];
  defaultVariant: string;
  percentage: number; // 0-1
}

export class ABTestingService {
  static async assignVariant(userId: string, testId: string, config: ABTestConfig): Promise<string> {
    const testRef = db.collection('abTests').doc(testId);
    const userRef = db.collection('users').doc(userId);
    
    const testDoc = await testRef.get();
    if (!testDoc.exists) {
      await testRef.set({
        testId,
        variants: config.variants,
        defaultVariant: config.defaultVariant,
        percentage: config.percentage,
        createdAt: new Date().toISOString(),
      });
    }

    const userDoc = await userRef.get();
    let variant = userDoc.data()?.abTests?.[testId];
    
    if (!variant) {
      // Assign new variant
      const rand = Math.random();
      const cumulative = 0;
      let assignedVariant = config.defaultVariant;
      
      for (const v of config.variants) {
        const end = cumulative + config.percentage / config.variants.length;
        if (rand >= cumulative && rand < end) {
          assignedVariant = v;
          break;
        }
        cumulative = end;
      }
      
      variant = assignedVariant;
      
      // Update user
      await userRef.update({
        abTests: {
          ...userDoc.data()?.abTests,
          [testId]: variant,
        },
        updatedAt: new Date().toISOString(),
      });
      
      logger.info('A/B test variant assigned', { userId, testId, variant });
    }
    
    return variant;
  }

  static async trackMetric(userId: string, testId: string, metric: string, value: number): Promise<void> {
    await db.collection('abMetrics').add({
      userId,
      testId,
      metric,
      value,
      timestamp: new Date().toISOString(),
    });
    
    logger.info('A/B test metric tracked', { userId, testId, metric, value });
  }

  static async getTestResults(testId: string): Promise<any> {
    const metricsSnapshot = await db.collection('abMetrics')
      .where('testId', '==', testId)
      .get();
    
    const results = {};
    metricsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!results[data.variant]) {
        results[data.variant] = [];
      }
      results[data.variant].push(data.value);
    });
    
    return results;
  }
}
