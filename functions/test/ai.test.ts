import { describe, it, expect, vi } from 'vitest';
import { request } from 'vitest'; // Assuming vitest supports request mocking
import router from '../src/api/routes/ai';

const mockRequest = vi.fn();
const mockResponse = {
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
};

describe('AI API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify activity successfully', async () => {
    const req = {
      body: { context: 'Working on code' },
    };
    const res = { ...mockResponse, status: vi.fn().mockReturnValue({ json: vi.fn() }) };

    await router.post('/classify', req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      category: expect.any(String),
      confidence: expect.any(Number),
    }));
  });

  it('should generate insight successfully', async () => {
    const req = {
      body: { activityData: { app: 'code', duration: 3600 } },
    };
    const res = { ...mockResponse, status: vi.fn().mockReturnValue({ json: vi.fn() }) };

    await router.post('/insight', req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      insight: expect.any(String),
    }));
  });

  it('should analyze pattern successfully', async () => {
    const req = {
      body: { userId: 'test-user', event: { title: 'Test', category: 'coding' } },
    };
    const res = { ...mockResponse, status: vi.fn().mockReturnValue({ json: vi.fn() }) };

    await router.post('/analyze-pattern', req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      pattern_type: expect.any(String),
      description: expect.any(String),
    }));
  });

  it('should handle validation error in classify', async () => {
    const req = { body: {} };
    const res = { ...mockResponse, status: vi.fn().mockReturnValue({ json: vi.fn() }) };

    await router.post('/classify', req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Context is required',
    }));
  });
});
