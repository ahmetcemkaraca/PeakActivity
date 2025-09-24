import * as admin from 'firebase-admin';

export interface Feedback {
    id: string;
    userId: string;
    subject: string;
    message: string;
    timestamp: admin.firestore.FieldValue;
    status: 'new' | 'in-progress' | 'resolved';
} 