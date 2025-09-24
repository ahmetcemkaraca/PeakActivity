import { Router } from 'express';
import { authService } from '../../services/auth-service';
import { z } from 'zod';

const router = Router();

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = signUpSchema.parse(req.body);
    const result = await authService.signUp(email, password, displayName);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
});

router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;
    const decodedToken = await authService.verifyIdToken(idToken);
    res.json(decodedToken);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.put('/profile/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const profileData = req.body;
    const result = await authService.updateUserProfile(uid, profileData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/profile/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const profile = await authService.getUserProfile(uid);
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
