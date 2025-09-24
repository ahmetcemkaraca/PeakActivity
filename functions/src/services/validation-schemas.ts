import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email('Invalid email format'),
  displayName: z.string().min(1, 'Display name is required'),
  preferences: z.object({
    timezone: z.string().default('UTC'),
    language: z.string().default('en'),
    notifications: z.boolean().default(true),
  }).optional(),
});

export const BucketSchema = z.object({
  type: z.string().min(1, 'Bucket type is required'),
  client: z.string().min(1, 'Client name is required'),
  hostname: z.string().min(1, 'Hostname is required'),
});

export const EventSchema = z.object({
  timestamp: z.string().datetime(),
  duration: z.number().min(0, 'Duration must be non-negative'),
  data: z.object({}).optional(),
});

export const ProfileDataSchema = z.object({
  displayName: z.string().optional(),
  preferences: z.object({
    timezone: z.string().optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
  }).optional(),
});
