export function firestoreSecurityCheck(action: string, user: { uid: string, role: string } | null): boolean {
    if (!user) return false;
    if (action === 'read') return true;
    if (action === 'write') return user.role === 'admin';
    return false;
} 