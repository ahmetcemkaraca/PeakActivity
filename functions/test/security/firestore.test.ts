import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firestoreSecurityCheck } from '../../src/security/firestore';

// Türkçe açıklamalar eklendi

describe('firestoreSecurityCheck', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Geçerli bir kullanıcı ile okuma izni olmalı', async () => {
        const user = { uid: 'user1', role: 'user' };
        const result = await firestoreSecurityCheck('read', user);
        expect(result).toBe(true);
    });

    it('Yetkisiz kullanıcı ile okuma izni olmamalı', async () => {
        const user = null;
        const result = await firestoreSecurityCheck('read', user);
        expect(result).toBe(false);
    });

    it('Admin kullanıcı ile yazma izni olmalı', async () => {
        const user = { uid: 'admin1', role: 'admin' };
        const result = await firestoreSecurityCheck('write', user);
        expect(result).toBe(true);
    });

    it('Normal kullanıcı ile yazma izni olmamalı', async () => {
        const user = { uid: 'user1', role: 'user' };
        const result = await firestoreSecurityCheck('write', user);
        expect(result).toBe(false);
    });

    it('Bilinmeyen işlem tipi ile false dönmeli', async () => {
        const user = { uid: 'user1', role: 'user' };
        const result = await firestoreSecurityCheck('unknown', user);
        expect(result).toBe(false);
    });
}); 