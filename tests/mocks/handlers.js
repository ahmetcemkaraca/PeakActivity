import { rest } from 'msw';

// Mock Firebase API endpoints
export const handlers = [
  rest.get('/api/activities', (req, res, ctx) => {
    return res(
      ctx.json({
        events: [
          {
            id: 'mock-event-1',
            timestamp: '2024-01-01T10:00:00Z',
            duration: 3600,
            data: { app: 'code.exe', title: 'Mock Activity' }
          }
        ],
        totalCount: 1
      })
    );
  }),

  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        uid: 'mock-uid',
        email: 'test@example.com',
        token: 'mock-token'
      })
    );
  }),

  rest.get('/api/ai/insights', (req, res, ctx) => {
    return res(
      ctx.json({
        insights: [
          {
            type: 'productivity',
            title: 'Take a break',
            description: 'You have been working for 2 hours'
          }
        ]
      })
    );
  })
];
