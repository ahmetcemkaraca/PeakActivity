import { AWClient } from 'aw-client';

import { useSettingsStore } from '~/stores/settings';

let _client: AWClient | null;

export function createClient(force?: boolean): AWClient {
  let baseURL = '';

  const production = typeof PRODUCTION !== 'undefined' && PRODUCTION;

  // If running with `npm node dev`, use testing server as origin.
  // Works since CORS is enabled by default when running `aw-server --testing`.
  if (!production) {
    const aw_server_url = typeof AW_SERVER_URL !== 'undefined' && AW_SERVER_URL;
    baseURL = aw_server_url || 'http://127.0.0.1:5666';
  }

  if (!_client || force) {
    _client = new AWClient('aw-webui', {
      testing: !production,
      baseURL,
    });
  } else {
    throw 'Tried to instantiate global AWClient twice!';
  }
  return _client;
}

export function configureClient(): void {
  const settings = useSettingsStore();
  _client.req.defaults.timeout = 1000 * settings.requestTimeout;
}

export function getClient(): AWClient {
  if (!_client) {
    throw 'Tried to get global AWClient before instantiating it!';
  }
  return _client;
}

// New function for Focus Quality Score
export async function getFocusQualityScore(events: any[], user_tz: string): Promise<any> {
  const client = getClient();
  const response = await client.post('/api/0/ai/focus-quality-score', { events, user_tz });
  return response.data;
}

// New function for Behavioral Patterns & Trend Analysis
export async function getBehavioralTrends(daily_totals: any[], window: number): Promise<any> {
  const client = getClient();
  const response = await client.post('/api/0/ai/behavioral-trends', { daily_totals, window });
  return response.data;
}

// New function for Anomaly Detection
export async function getAnomalyDetection(daily_totals: any[]): Promise<any> {
  const client = getClient();
  const response = await client.post('/api/0/ai/anomaly-detection', { daily_totals });
  return response.data;
}

// New function for Community-Based Rule Sets
export async function applyCommunityRules(event: any, community_rules: any[]): Promise<any> {
  const client = getClient();
  const response = await client.post('/api/0/ai/community-rules', { event, community_rules });
  return response.data;
}

// New function for Contextual Categorization (Title/Content Analysis)
export async function getContextualCategorization(
  context: string,
  language?: string
): Promise<any> {
  const client = getClient();
  const payload: { context: string; language?: string } = { context };
  if (language) {
    payload.language = language;
  }
  const response = await client.post('/api/0/ai/contextual-categorization', payload);
  return response.data;
}
