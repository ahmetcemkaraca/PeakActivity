import { Router } from 'express';
import { GeminiService } from '../../services/gemini-service';
import { BehavioralAnalysisService } from '../../services/behavioral-analysis-service';

const router = Router();
const geminiService = new GeminiService();
const behavioralService = new BehavioralAnalysisService();

router.post('/classify', async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'Context is required' });
    }
    const result = await geminiService.classifyActivity(context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Classification failed' });
  }
});

router.post('/insight', async (req, res) => {
  try {
    const { activityData } = req.body;
    if (!activityData) {
      return res.status(400).json({ error: 'Activity data is required' });
    }
    const insight = await geminiService.generateInsight(JSON.stringify(activityData));
    res.json({ insight });
  } catch (error) {
    res.status(500).json({ error: 'Insight generation failed' });
  }
});

router.post('/analyze-pattern', async (req, res) => {
  try {
    const { userId, event } = req.body;
    if (!userId || !event) {
      return res.status(400).json({ error: 'UserId and event are required' });
    }
    const pattern = await behavioralService.analyzeRealtimeBehavioralPattern(userId, event);
    res.json(pattern);
  } catch (error) {
    res.status(500).json({ error: 'Pattern analysis failed' });
  }
});

export default router;
