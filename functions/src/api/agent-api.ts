/**
 * Agent Generation and Execution API
 * Integrates PraisonAI agents with ActivityWatch data via aw-server
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import axios from 'axios';
import { requireAuth } from '../middlewares/requireAuth';
import { AgentExecutionService } from '../services/agent-execution-service';

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const agentExecutionService = new AgentExecutionService();

interface AgentGenerationRequest {
  agentConfigYaml: string;
  topic: string;
  scheduledRun?: boolean;
  triggerType?: 'manual' | 'scheduled' | 'event_triggered';
}

/**
 * Generate and execute AI agents
 */
export const generateAgent = onCall(
  {
    secrets: [geminiApiKey],
    enforceAppCheck: true,
    timeoutSeconds: 300, // 5 minutes
    memory: '512MiB'
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const data = request.data as AgentGenerationRequest;

    // Validate input
    if (!data.agentConfigYaml || !data.topic) {
      throw new HttpsError('invalid-argument', 'Agent configuration (YAML) and topic are required');
    }

    const startTime = Date.now();

    // Create agent run record
    const runId = await agentExecutionService.createAgentRun(userId, {
      agentConfigYaml: data.agentConfigYaml,
      topic: data.topic,
      scheduledRun: data.scheduledRun || false,
      triggerType: data.triggerType || 'manual'
    });

    try {
      // Update status to running
      await agentExecutionService.updateAgentRunStatus(userId, runId, 'running');

      // Get aw-server URL from environment or use default
      const awServerUrl = process.env.AW_SERVER_URL || 'http://localhost:5600';

      // Call aw-server agent generation endpoint
      const response = await axios.post(
        `${awServerUrl}/api/0/agents/generate`,
        {
          agent_config_data: data.agentConfigYaml,
          topic: data.topic,
          user_id: userId // Pass user_id for context-aware tools
        },
        {
          headers: {
            'X-Gemini-Api-Key': geminiApiKey.value(),
            'Content-Type': 'application/json'
          },
          timeout: 240000 // 4 minutes (less than function timeout)
        }
      );

      const executionTimeMs = Date.now() - startTime;

      // Update run record with success
      await agentExecutionService.updateAgentRunStatus(userId, runId, 'completed', {
        result: {
          success: true,
          result: JSON.stringify(response.data),
          agentsCount: response.data.agents_count || 0,
          tasksCount: response.data.tasks_count || 0,
          executionTimeMs
        }
      });

      logger.info(`Agent execution completed in ${executionTimeMs}ms`, {
        userId,
        runId,
        topic: data.topic
      });

      return {
        success: true,
        runId,
        result: response.data,
        executionTimeMs
      };

    } catch (error: any) {
      const executionTimeMs = Date.now() - startTime;

      // Update run record with failure
      await agentExecutionService.updateAgentRunStatus(userId, runId, 'failed', {
        error: error.message,
        result: {
          success: false,
          error: error.message,
          agentsCount: 0,
          tasksCount: 0,
          executionTimeMs
        }
      });

      logger.error('Agent execution failed', {
        userId,
        runId,
        error: error.message,
        executionTimeMs
      });

      if (error.response) {
        throw new HttpsError(
          'internal',
          `Failed to generate agent: ${error.response.data?.message || error.message}`
        );
      } else if (error.code === 'ECONNREFUSED') {
        throw new HttpsError(
          'unavailable',
          'aw-server is not reachable. Please check if it is running.'
        );
      } else {
        throw new HttpsError('internal', `Failed to generate agent: ${error.message}`);
      }
    }
  }
); 