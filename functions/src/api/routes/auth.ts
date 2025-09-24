import { Router } from 'express';
import { authService } from '../../services/auth-service';
import { UserSchema, ProfileDataSchema } from '../../services/validation-schemas';
import { z } from 'zod';

const router = Router();

const signUpSchema = UserSchema.omit({ id: true }); // Omit id for signUp
const profileUpdateSchema = ProfileDataSchema;

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
    const { email, password } = req.body; // Login validation can be added if needed
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
    const profileData = profileUpdateSchema.parse(req.body);
    const result = await authService.updateUserProfile(uid, profileData);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
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
