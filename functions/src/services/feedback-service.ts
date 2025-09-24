import * as admin from 'firebase-admin';
import { Feedback } from '../types/feedback';

export class FeedbackService {
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async submitFeedback(userId: string, feedbackData: { subject: string; message: string }): Promise<Feedback> {
        const feedbackRef = this.db.collection('feedback').doc();
        const newFeedback: Feedback = {
            id: feedbackRef.id,
            userId: userId,
            subject: feedbackData.subject,
            message: feedbackData.message,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'new',
        };

        await feedbackRef.set(newFeedback);
        return newFeedback;
    }
} 