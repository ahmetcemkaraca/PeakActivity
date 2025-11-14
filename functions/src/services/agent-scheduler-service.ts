/**
 * Agent Scheduler Service
 * Manages scheduled periodic agent execution
 */

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { AgentExecutionService } from './agent-execution-service';
import type { AgentRunConfig } from './agent-execution-service';

export interface AgentSchedule {
  userId: string;
  name: string;
  description?: string;
  agentConfig: AgentRunConfig;
  schedule: {
    type: 'cron' | 'interval' | 'once';
    expression?: string; // Cron expression for 'cron' type
    intervalMs?: number; // Milliseconds for 'interval' type
    runAt?: Timestamp; // Specific time for 'once' type
  };
  enabled: boolean;
  lastRun?: {
    runId: string;
    timestamp: Timestamp;
    status: 'completed' | 'failed';
  };
  nextRun?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastError?: string;
  };
}

export interface ScheduleCreateRequest {
  name: string;
  description?: string;
  agentConfigYaml: string;
  topic: string;
  schedule: AgentSchedule['schedule'];
  enabled?: boolean;
}

export class AgentSchedulerService {
  private db = getFirestore();
  private agentExecutionService: AgentExecutionService;

  constructor() {
    this.agentExecutionService = new AgentExecutionService();
  }

  /**
   * Create a new scheduled agent job
   */
  async createSchedule(userId: string, request: ScheduleCreateRequest): Promise<string> {
    // Validate schedule
    this.validateSchedule(request.schedule);

    const nextRun = this.calculateNextRun(request.schedule);

    const scheduleData: AgentSchedule = {
      userId,
      name: request.name,
      description: request.description,
      agentConfig: {
        agentConfigYaml: request.agentConfigYaml,
        topic: request.topic,
        scheduledRun: true
      },
      schedule: request.schedule,
      enabled: request.enabled ?? true,
      nextRun,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      metadata: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0
      }
    };

    const scheduleRef = await this.db
      .collection(`users/${userId}/agent_schedules`)
      .add(scheduleData);

    logger.info('Agent schedule created', {
      userId,
      scheduleId: scheduleRef.id,
      nextRun: nextRun?.toDate()
    });

    return scheduleRef.id;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(
    userId: string,
    scheduleId: string,
    updates: Partial<ScheduleCreateRequest>
  ): Promise<void> {
    const scheduleRef = this.db.doc(`users/${userId}/agent_schedules/${scheduleId}`);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      throw new Error('Schedule not found');
    }

    const currentSchedule = scheduleDoc.data() as AgentSchedule;
    const updateData: Partial<AgentSchedule> = {
      updatedAt: Timestamp.now()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

    if (updates.agentConfigYaml || updates.topic) {
      updateData.agentConfig = {
        agentConfigYaml: updates.agentConfigYaml || currentSchedule.agentConfig.agentConfigYaml,
        topic: updates.topic || currentSchedule.agentConfig.topic,
        scheduledRun: true
      };
    }

    if (updates.schedule) {
      this.validateSchedule(updates.schedule);
      updateData.schedule = updates.schedule;
      updateData.nextRun = this.calculateNextRun(updates.schedule);
    }

    await scheduleRef.update(updateData);

    logger.info('Agent schedule updated', { userId, scheduleId });
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(userId: string, scheduleId: string): Promise<void> {
    await this.db.doc(`users/${userId}/agent_schedules/${scheduleId}`).delete();
    logger.info('Agent schedule deleted', { userId, scheduleId });
  }

  /**
   * Get a specific schedule
   */
  async getSchedule(userId: string, scheduleId: string): Promise<(AgentSchedule & { id: string }) | null> {
    const doc = await this.db.doc(`users/${userId}/agent_schedules/${scheduleId}`).get();

    if (!doc.exists) {
      return null;
    }

    return { ...(doc.data() as AgentSchedule), id: doc.id };
  }

  /**
   * List all schedules for a user
   */
  async listSchedules(
    userId: string,
    options: {
      enabled?: boolean;
      limit?: number;
    } = {}
  ): Promise<Array<AgentSchedule & { id: string }>> {
    let query = this.db
      .collection(`users/${userId}/agent_schedules`)
      .orderBy('createdAt', 'desc');

    if (options.enabled !== undefined) {
      query = query.where('enabled', '==', options.enabled);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      ...(doc.data() as AgentSchedule),
      id: doc.id
    }));
  }

  /**
   * Execute a scheduled agent
   * This is called by Cloud Scheduler or a periodic function
   */
  async executeScheduledAgent(userId: string, scheduleId: string): Promise<string> {
    const scheduleRef = this.db.doc(`users/${userId}/agent_schedules/${scheduleId}`);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      throw new Error('Schedule not found');
    }

    const schedule = scheduleDoc.data() as AgentSchedule;

    if (!schedule.enabled) {
      logger.info('Schedule is disabled, skipping execution', { userId, scheduleId });
      return '';
    }

    logger.info('Executing scheduled agent', {
      userId,
      scheduleId,
      agentTopic: schedule.agentConfig.topic
    });

    try {
      // Create agent run
      const runId = await this.agentExecutionService.createAgentRun(
        userId,
        schedule.agentConfig,
        3 // Max retries for scheduled jobs
      );

      // Update schedule with last run info
      await scheduleRef.update({
        lastRun: {
          runId,
          timestamp: Timestamp.now(),
          status: 'completed'
        },
        nextRun: this.calculateNextRun(schedule.schedule),
        updatedAt: Timestamp.now(),
        'metadata.totalRuns': FieldValue.increment(1),
        'metadata.successfulRuns': FieldValue.increment(1)
      });

      logger.info('Scheduled agent executed successfully', {
        userId,
        scheduleId,
        runId
      });

      return runId;

    } catch (error: any) {
      logger.error('Scheduled agent execution failed', {
        userId,
        scheduleId,
        error: error.message
      });

      // Update schedule with failure info
      await scheduleRef.update({
        lastRun: {
          runId: '',
          timestamp: Timestamp.now(),
          status: 'failed'
        },
        nextRun: this.calculateNextRun(schedule.schedule),
        updatedAt: Timestamp.now(),
        'metadata.totalRuns': FieldValue.increment(1),
        'metadata.failedRuns': FieldValue.increment(1),
        'metadata.lastError': error.message
      });

      throw error;
    }
  }

  /**
   * Process due schedules
   * Called by a Cloud Function on a schedule (e.g., every 5 minutes)
   */
  async processDueSchedules(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const now = Timestamp.now();

    // Find all enabled schedules where nextRun <= now
    const dueSchedulesSnapshot = await this.db
      .collectionGroup('agent_schedules')
      .where('enabled', '==', true)
      .where('nextRun', '<=', now)
      .get();

    logger.info(`Found ${dueSchedulesSnapshot.size} due schedules to process`);

    let successful = 0;
    let failed = 0;

    for (const doc of dueSchedulesSnapshot.docs) {
      const schedule = doc.data() as AgentSchedule;
      const userId = schedule.userId;
      const scheduleId = doc.id;

      try {
        await this.executeScheduledAgent(userId, scheduleId);
        successful++;
      } catch (error: any) {
        logger.error('Failed to execute scheduled agent', {
          userId,
          scheduleId,
          error: error.message
        });
        failed++;
      }
    }

    return {
      processed: dueSchedulesSnapshot.size,
      successful,
      failed
    };
  }

  /**
   * Validate schedule configuration
   */
  private validateSchedule(schedule: AgentSchedule['schedule']): void {
    if (schedule.type === 'cron') {
      if (!schedule.expression) {
        throw new Error('Cron expression is required for cron schedule type');
      }
      // Validate cron expression format
      if (!this.isValidCronExpression(schedule.expression)) {
        throw new Error('Invalid cron expression');
      }
    } else if (schedule.type === 'interval') {
      if (!schedule.intervalMs || schedule.intervalMs < 60000) {
        throw new Error('Interval must be at least 60 seconds (60000ms)');
      }
    } else if (schedule.type === 'once') {
      if (!schedule.runAt) {
        throw new Error('runAt timestamp is required for once schedule type');
      }
    } else {
      throw new Error('Invalid schedule type');
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRun(schedule: AgentSchedule['schedule']): Timestamp | undefined {
    const now = new Date();

    if (schedule.type === 'cron') {
      // Use cron-parser library or implement basic cron parsing
      // For simplicity, here's a basic implementation
      return this.parseNextCronTime(schedule.expression!, now);

    } else if (schedule.type === 'interval') {
      const nextRunMs = now.getTime() + schedule.intervalMs!;
      return Timestamp.fromMillis(nextRunMs);

    } else if (schedule.type === 'once') {
      return schedule.runAt;
    }

    return undefined;
  }

  /**
   * Basic cron expression validation
   */
  private isValidCronExpression(expression: string): boolean {
    // Basic validation: should have 5 parts (minute hour day month weekday)
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      return false;
    }

    // Each part should be either *, number, or range
    const validPartRegex = /^(\*|[0-9]+(-[0-9]+)?(,[0-9]+(-[0-9]+)?)*)$/;
    return parts.every(part => validPartRegex.test(part));
  }

  /**
   * Parse cron expression to next run time
   * Simplified implementation for common patterns
   */
  private parseNextCronTime(expression: string, from: Date): Timestamp {
    // Parse cron expression parts (keeping for future expansion)
    // Format: minute hour dayOfMonth month dayOfWeek
    // const parts = expression.split(' ');
    // const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const next = new Date(from);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // Simple cases
    if (expression === '0 0 * * *') {
      // Daily at midnight
      next.setHours(0, 0, 0, 0);
      if (next <= from) {
        next.setDate(next.getDate() + 1);
      }
    } else if (expression === '0 * * * *') {
      // Every hour
      next.setMinutes(0);
      if (next <= from) {
        next.setHours(next.getHours() + 1);
      }
    } else if (expression === '*/15 * * * *') {
      // Every 15 minutes
      const currentMinute = next.getMinutes();
      const nextMinute = Math.ceil((currentMinute + 1) / 15) * 15;
      next.setMinutes(nextMinute % 60);
      if (nextMinute >= 60) {
        next.setHours(next.getHours() + 1);
      }
    } else if (expression === '0 9 * * *') {
      // Daily at 9 AM
      next.setHours(9, 0, 0, 0);
      if (next <= from) {
        next.setDate(next.getDate() + 1);
      }
    } else if (expression === '0 0 * * 1') {
      // Weekly on Monday at midnight
      next.setHours(0, 0, 0, 0);
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
    } else {
      // Default: add 1 hour for unknown patterns
      next.setTime(from.getTime() + 60 * 60 * 1000);
      logger.warn('Unknown cron pattern, defaulting to +1 hour', { expression });
    }

    return Timestamp.fromDate(next);
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(userId: string): Promise<{
    totalSchedules: number;
    enabledSchedules: number;
    disabledSchedules: number;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
  }> {
    const schedules = await this.listSchedules(userId);

    const stats = {
      totalSchedules: schedules.length,
      enabledSchedules: schedules.filter(s => s.enabled).length,
      disabledSchedules: schedules.filter(s => !s.enabled).length,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0
    };

    for (const schedule of schedules) {
      if (schedule.metadata) {
        stats.totalRuns += schedule.metadata.totalRuns || 0;
        stats.successfulRuns += schedule.metadata.successfulRuns || 0;
        stats.failedRuns += schedule.metadata.failedRuns || 0;
      }
    }

    return stats;
  }
}
