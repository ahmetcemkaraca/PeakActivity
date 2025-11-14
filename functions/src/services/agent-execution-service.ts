/**
 * Agent Execution Service
 * Manages AI agent execution runs, stores results, and tracks performance
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface AgentRunConfig {
  agentConfigYaml: string;
  topic: string;
  scheduledRun: boolean;
  triggerType?: 'manual' | 'scheduled' | 'event_triggered';
  triggerMetadata?: Record<string, any>;
}

export interface AgentRunResult {
  success: boolean;
  result?: string;
  error?: string;
  agentsCount: number;
  tasksCount: number;
  executionTimeMs: number;
}

export interface AgentRunDocument {
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: AgentRunConfig;
  result?: AgentRunResult;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export class AgentExecutionService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Create a new agent run record
   */
  async createAgentRun(
    userId: string,
    config: AgentRunConfig,
    maxRetries: number = 0
  ): Promise<string> {
    const runData: AgentRunDocument = {
      userId,
      status: 'pending',
      config,
      createdAt: Timestamp.now(),
      retryCount: 0,
      maxRetries
    };

    const runRef = await this.db
      .collection(`users/${userId}/agent_runs`)
      .add(runData);

    return runRef.id;
  }

  /**
   * Update agent run status
   */
  async updateAgentRunStatus(
    userId: string,
    runId: string,
    status: 'running' | 'completed' | 'failed',
    data?: {
      result?: AgentRunResult;
      error?: string;
    }
  ): Promise<void> {
    const updateData: Partial<AgentRunDocument> = {
      status
    };

    if (status === 'running') {
      updateData.startedAt = Timestamp.now();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = Timestamp.now();
    }

    if (data?.result) {
      updateData.result = data.result;
    }

    if (data?.error) {
      updateData.error = data.error;
    }

    await this.db
      .doc(`users/${userId}/agent_runs/${runId}`)
      .update(updateData);
  }

  /**
   * Get agent run by ID
   */
  async getAgentRun(
    userId: string,
    runId: string
  ): Promise<AgentRunDocument | null> {
    const doc = await this.db
      .doc(`users/${userId}/agent_runs/${runId}`)
      .get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as AgentRunDocument;
  }

  /**
   * List agent runs for a user
   */
  async listAgentRuns(
    userId: string,
    options: {
      limit?: number;
      status?: 'pending' | 'running' | 'completed' | 'failed';
      orderBy?: 'createdAt' | 'completedAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<Array<AgentRunDocument & { id: string }>> {
    const {
      limit = 50,
      status,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = options;

    let query = this.db
      .collection(`users/${userId}/agent_runs`)
      .orderBy(orderBy, orderDirection)
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as AgentRunDocument
    }));
  }

  /**
   * Get agent run statistics
   */
  async getAgentRunStats(userId: string): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageExecutionTimeMs: number;
    lastRunAt?: Date;
  }> {
    const runs = await this.listAgentRuns(userId, { limit: 1000 });

    const completed = runs.filter(r => r.status === 'completed');
    const failed = runs.filter(r => r.status === 'failed');

    const executionTimes = completed
      .filter(r => r.result?.executionTimeMs)
      .map(r => r.result!.executionTimeMs);

    const averageExecutionTimeMs = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    const lastRun = runs.length > 0 ? runs[0] : null;

    return {
      totalRuns: runs.length,
      successfulRuns: completed.length,
      failedRuns: failed.length,
      averageExecutionTimeMs,
      lastRunAt: lastRun?.createdAt.toDate()
    };
  }

  /**
   * Cleanup old agent runs (retention policy)
   */
  async cleanupOldRuns(
    userId: string,
    retentionDays: number = 90
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const snapshot = await this.db
      .collection(`users/${userId}/agent_runs`)
      .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Retry a failed agent run
   */
  async retryAgentRun(
    userId: string,
    runId: string
  ): Promise<string> {
    const originalRun = await this.getAgentRun(userId, runId);

    if (!originalRun) {
      throw new Error('Agent run not found');
    }

    if (originalRun.status !== 'failed') {
      throw new Error('Can only retry failed runs');
    }

    if (originalRun.retryCount >= originalRun.maxRetries) {
      throw new Error('Maximum retries exceeded');
    }

    // Create new run with incremented retry count
    const newRunData: AgentRunDocument = {
      ...originalRun,
      status: 'pending',
      createdAt: Timestamp.now(),
      retryCount: originalRun.retryCount + 1,
      startedAt: undefined,
      completedAt: undefined,
      error: undefined,
      result: undefined
    };

    const runRef = await this.db
      .collection(`users/${userId}/agent_runs`)
      .add(newRunData);

    return runRef.id;
  }
}
