import { Router } from 'express';
import { ABTestingService } from '../../services/ab-testing-service';

const router = Router();

router.post('/assign-variant', async (req, res) => {
  try {
    const { userId, testId, variants, defaultVariant, percentage } = req.body;
    if (!userId || !testId) {
      return res.status(400).json({ error: 'userId and testId are required' });
    }
    const config = { testId, variants, defaultVariant, percentage: percentage || 0.5 };
    const variant = await ABTestingService.assignVariant(userId, testId, config);
    res.json({ variant });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign variant' });
  }
});

router.post('/track-metric', async (req, res) => {
  try {
    const { userId, testId, metric, value } = req.body;
    if (!userId || !testId || metric === undefined || value === undefined) {
      return res.status(400).json({ error: 'userId, testId, metric, and value are required' });
    }
    await ABTestingService.trackMetric(userId, testId, metric, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track metric' });
  }
});

router.get('/results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await ABTestingService.getTestResults(testId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get test results' });
  }
});

export default router;
