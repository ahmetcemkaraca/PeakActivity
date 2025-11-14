/**
 * Agent Run Management API
 * Endpoints for managing and querying AI agent execution runs
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { requireAuth } from '../middlewares/requireAuth';
import { AgentExecutionService } from '../services/agent-execution-service';

const agentExecutionService = new AgentExecutionService();

/**
 * Get a specific agent run
 */
export const getAgentRun = onCall(
  { enforceAppCheck: true },
  async (request) => {
    requireAuth(request);

    const { runId } = request.data;
    const userId = request.auth!.uid;

    if (!runId || typeof runId !== 'string') {
      throw new HttpsError('invalid-argument', 'runId is required and must be a string');
    }

    const run = await agentExecutionService.getAgentRun(userId, runId);

    if (!run) {
      throw new HttpsError('not-found', 'Agent run not found');
    }

    return { run };
  }
);

/**
 * List agent runs for the authenticated user
 */
export const listAgentRuns = onCall(
  { enforceAppCheck: true },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const {
      limit = 50,
      status,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = request.data || {};

    const runs = await agentExecutionService.listAgentRuns(userId, {
      limit,
      status,
      orderBy,
      orderDirection
    });

    return { runs };
  }
);

/**
 * Get agent run statistics
 */
export const getAgentRunStats = onCall(
  { enforceAppCheck: true },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const stats = await agentExecutionService.getAgentRunStats(userId);

    return { stats };
  }
);

/**
 * Retry a failed agent run
 */
export const retryAgentRun = onCall(
  { enforceAppCheck: true },
  async (request) => {
    requireAuth(request);

    const { runId } = request.data;
    const userId = request.auth!.uid;

    if (!runId || typeof runId !== 'string') {
      throw new HttpsError('invalid-argument', 'runId is required and must be a string');
    }

    try {
      const newRunId = await agentExecutionService.retryAgentRun(userId, runId);

      return {
        success: true,
        newRunId,
        message: 'Agent run has been queued for retry'
      };
    } catch (error: any) {
      throw new HttpsError('failed-precondition', error.message);
    }
  }
);

/**
 * Cleanup old agent runs (admin or user-initiated)
 */
export const cleanupOldAgentRuns = onCall(
  { enforceAppCheck: true },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const { retentionDays = 90 } = request.data || {};

    if (typeof retentionDays !== 'number' || retentionDays < 1) {
      throw new HttpsError('invalid-argument', 'retentionDays must be a positive number');
    }

    const deletedCount = await agentExecutionService.cleanupOldRuns(userId, retentionDays);

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} old agent runs`
    };
  }
);
