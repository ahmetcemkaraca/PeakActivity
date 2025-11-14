/**
 * Agent Schedule API
 * CRUD operations for agent schedules
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { requireAuth } from '../middlewares/requireAuth';
import { AgentSchedulerService, ScheduleCreateRequest } from '../services/agent-scheduler-service';

const schedulerService = new AgentSchedulerService();

/**
 * Create a new agent schedule
 */
export const createAgentSchedule = onCall(
  {
    enforceAppCheck: true
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const data = request.data as ScheduleCreateRequest;

    // Validate required fields
    if (!data.name || !data.agentConfigYaml || !data.topic || !data.schedule) {
      throw new HttpsError(
        'invalid-argument',
        'name, agentConfigYaml, topic, and schedule are required'
      );
    }

    try {
      const scheduleId = await schedulerService.createSchedule(userId, data);

      return {
        success: true,
        scheduleId,
        message: 'Agent schedule created successfully'
      };

    } catch (error: any) {
      throw new HttpsError('internal', `Failed to create schedule: ${error.message}`);
    }
  }
);

/**
 * Update an existing agent schedule
 */
export const updateAgentSchedule = onCall(
  {
    enforceAppCheck: true
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const { scheduleId, ...updates } = request.data;

    if (!scheduleId) {
      throw new HttpsError('invalid-argument', 'scheduleId is required');
    }

    try {
      await schedulerService.updateSchedule(userId, scheduleId, updates);

      return {
        success: true,
        message: 'Agent schedule updated successfully'
      };

    } catch (error: any) {
      throw new HttpsError('internal', `Failed to update schedule: ${error.message}`);
    }
  }
);

/**
 * Delete an agent schedule
 */
export const deleteAgentSchedule = onCall(
  {
    enforceAppCheck: true
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const { scheduleId } = request.data;

    if (!scheduleId) {
      throw new HttpsError('invalid-argument', 'scheduleId is required');
    }

    try {
      await schedulerService.deleteSchedule(userId, scheduleId);

      return {
        success: true,
        message: 'Agent schedule deleted successfully'
      };

    } catch (error: any) {
      throw new HttpsError('internal', `Failed to delete schedule: ${error.message}`);
    }
  }
);

/**
 * Get a specific agent schedule
 */
export const getAgentSchedule = onCall(
  {
    enforceAppCheck: true
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const { scheduleId } = request.data;

    if (!scheduleId) {
      throw new HttpsError('invalid-argument', 'scheduleId is required');
    }

    try {
      const schedule = await schedulerService.getSchedule(userId, scheduleId);

      if (!schedule) {
        throw new HttpsError('not-found', 'Schedule not found');
      }

      return {
        success: true,
        schedule
      };

    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', `Failed to get schedule: ${error.message}`);
    }
  }
);

/**
 * List all agent schedules for the user
 */
export const listAgentSchedules = onCall(
  {
    enforceAppCheck: true
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const { enabled, limit } = request.data || {};

    try {
      const schedules = await schedulerService.listSchedules(userId, {
        enabled,
        limit
      });

      return {
        success: true,
        schedules,
        count: schedules.length
      };

    } catch (error: any) {
      throw new HttpsError('internal', `Failed to list schedules: ${error.message}`);
    }
  }
);

/**
 * Get schedule statistics for the user
 */
export const getAgentScheduleStats = onCall(
  {
    enforceAppCheck: true
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;

    try {
      const stats = await schedulerService.getScheduleStats(userId);

      return {
        success: true,
        stats
      };

    } catch (error: any) {
      throw new HttpsError('internal', `Failed to get schedule stats: ${error.message}`);
    }
  }
);

/**
 * Manually trigger a scheduled agent
 */
export const triggerAgentSchedule = onCall(
  {
    enforceAppCheck: true,
    timeoutSeconds: 300
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const { scheduleId } = request.data;

    if (!scheduleId) {
      throw new HttpsError('invalid-argument', 'scheduleId is required');
    }

    try {
      const runId = await schedulerService.executeScheduledAgent(userId, scheduleId);

      return {
        success: true,
        runId,
        message: 'Agent schedule triggered successfully'
      };

    } catch (error: any) {
      throw new HttpsError('internal', `Failed to trigger schedule: ${error.message}`);
    }
  }
);

/**
 * Cloud Scheduler Function - Processes due schedules every 5 minutes
 * This function is triggered by Cloud Scheduler
 */
export const processAgentSchedules = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
    retryCount: 3,
    maxRetrySeconds: 300
  },
  async (event) => {
    try {
      const result = await schedulerService.processDueSchedules();

      console.log('Agent schedules processed', result);

    } catch (error: any) {
      console.error('Failed to process agent schedules', error);
      throw error;
    }
  }
);
