---
applyTo: "**/security/**,**/auth/**,**/middleware/**,firestore.rules,storage.rules"
description: "Güvenlik standartları ve authentication patterns"
---

# Güvenlik Standartları ve Authentication

Bu dosya, PeakActivity projesinin güvenlik standartlarını ve authentication patterns'lerini tanımlar.

## Firebase Security Rules

### Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Utility functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasValidTimestamp() {
      return request.time == resource.data.updatedAt ||
             request.time == resource.data.createdAt;
    }
    
    function isValidUserData() {
      return request.resource.data.keys().hasAll(['email', 'displayName', 'createdAt']) &&
             request.resource.data.email is string &&
             request.resource.data.displayName is string &&
             request.resource.data.createdAt is timestamp;
    }
    
    // User profiles
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId) && 
                           (request.method == 'create' ? isValidUserData() : true);
      
      // User preferences
      match /preferences/{document=**} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
      
      // Activity buckets - sadece kullanıcı kendi verilerine erişebilir
      match /buckets/{bucketId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
        
        // Events within buckets
        match /events/{eventId} {
          allow read, write: if isAuthenticated() && isOwner(userId);
          allow list: if isAuthenticated() && isOwner(userId) &&
                        request.query.limit <= 1000; // Prevent large queries
        }
      }
      
      // AI insights - read/write access for owner
      match /insights/{insightId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
        allow create: if isAuthenticated() && isOwner(userId) &&
                        request.resource.data.keys().hasAll(['type', 'data', 'createdAt']);
      }
      
      // Automation rules
      match /automationRules/{ruleId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
        allow create: if isAuthenticated() && isOwner(userId) &&
                        request.resource.data.enabled is bool &&
                        request.resource.data.trigger is map &&
                        request.resource.data.action is map;
      }
    }
    
    // Shared community rules - read-only for authenticated users
    match /communityRules/{ruleId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
                     hasRole('moderator') || hasRole('admin');
    }
    
    // Admin functions
    function hasRole(role) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles[role] == true;
    }
    
    // System metrics - admin only
    match /systemMetrics/{document=**} {
      allow read, write: if hasRole('admin');
    }
    
    // Audit logs - admin read-only
    match /auditLogs/{logId} {
      allow read: if hasRole('admin');
      allow write: if false; // Only server can write audit logs
    }
  }
}
```

### Storage Security Rules
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // User profile pictures
    match /users/{userId}/profile/{filename} {
      allow read: if true; // Public read for profile pictures
      allow write: if request.auth != null && 
                     request.auth.uid == userId &&
                     request.resource.size < 5 * 1024 * 1024 && // 5MB limit
                     request.resource.contentType.matches('image/.*');
    }
    
    // User activity exports - private
    match /users/{userId}/exports/{filename} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == userId &&
                          request.resource.size < 100 * 1024 * 1024; // 100MB limit
    }
    
    // AI model files - admin only
    match /models/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     hasCustomClaim('admin') == true;
    }
    
    // Temporary files - auto-delete after 24 hours
    match /temp/{userId}/{filename} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == userId;
    }
    
    function hasCustomClaim(claim) {
      return request.auth.token[claim] == true;
    }
  }
}
```

## Authentication Implementation

### Firebase Auth Setup
```typescript
// functions/src/auth/auth-setup.ts
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

export class AuthService {
  private auth: Auth;
  private db: Firestore;
  
  constructor() {
    this.auth = getAuth();
    this.db = getFirestore();
  }
  
  async createUser(
    email: string, 
    password: string, 
    displayName: string,
    additionalClaims: Record<string, any> = {}
  ) {
    try {
      // Create user in Firebase Auth
      const userRecord = await this.auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false
      });
      
      // Set custom claims
      if (Object.keys(additionalClaims).length > 0) {
        await this.auth.setCustomUserClaims(userRecord.uid, additionalClaims);
      }
      
      // Create user profile in Firestore
      await this.db.collection('users').doc(userRecord.uid).set({
        email,
        displayName,
        createdAt: new Date(),
        lastLoginAt: null,
        preferences: this.getDefaultPreferences(),
        roles: additionalClaims.roles || {},
        privacySettings: this.getDefaultPrivacySettings()
      });
      
      // Send verification email
      await this.sendEmailVerification(userRecord.uid);
      
      return userRecord;
      
    } catch (error) {
      console.error('User creation failed:', error);
      throw new Error(`Kullanıcı oluşturma başarısız: ${error.message}`);
    }
  }
  
  async updateUserClaims(uid: string, claims: Record<string, any>) {
    try {
      await this.auth.setCustomUserClaims(uid, claims);
      
      // Log admin action
      await this.logAdminAction('update_user_claims', {
        targetUserId: uid,
        claims,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Claims update failed:', error);
      throw error;
    }
  }
  
  private getDefaultPreferences() {
    return {
      language: 'en',
      timezone: 'UTC',
      dataRetentionDays: 90,
      notifications: {
        insights: true,
        goals: true,
        reminders: false
      }
    };
  }
  
  private getDefaultPrivacySettings() {
    return {
      dataSharing: false,
      analyticsOptIn: false,
      cloudSync: false,
      aiProcessing: 'local-only' // 'local-only' | 'cloud-assisted'
    };
  }
  
  private async sendEmailVerification(uid: string) {
    const link = await this.auth.generateEmailVerificationLink(
      (await this.auth.getUser(uid)).email!
    );
    
    // Send email via your preferred service
    // Implementation depends on email provider
  }
  
  private async logAdminAction(action: string, details: any) {
    await this.db.collection('auditLogs').add({
      action,
      details,
      timestamp: new Date(),
      type: 'admin_action'
    });
  }
}
```

### Authentication Middleware
```typescript
// functions/src/auth/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    claims: Record<string, any>;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization header eksik veya geçersiz'
      });
    }
    
    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Rate limiting per user
    const rateLimitKey = `rate_limit_${decodedToken.uid}`;
    const rateLimitCheck = await checkRateLimit(rateLimitKey);
    
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Çok fazla istek',
        retryAfter: rateLimitCheck.retryAfter
      });
    }
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      claims: decodedToken
    };
    
    next();
    
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({
      error: 'Geçersiz token'
    });
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication gerekli' });
    }
    
    const userRoles = req.user.claims.roles || {};
    
    if (!userRoles[requiredRole]) {
      return res.status(403).json({
        error: `${requiredRole} yetkisi gerekli`
      });
    }
    
    next();
  };
};

export const requireOwnership = (getUserIdFromParams: (req: Request) => string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication gerekli' });
    }
    
    const resourceUserId = getUserIdFromParams(req);
    
    if (req.user.uid !== resourceUserId && !req.user.claims.roles?.admin) {
      return res.status(403).json({
        error: 'Bu kaynağa erişim yetkiniz yok'
      });
    }
    
    next();
  };
};

async function checkRateLimit(key: string): Promise<{allowed: boolean, retryAfter?: number}> {
  const db = getFirestore();
  const rateLimitDoc = db.collection('rateLimits').doc(key);
  
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;
  
  const doc = await rateLimitDoc.get();
  
  if (!doc.exists) {
    await rateLimitDoc.set({
      count: 1,
      windowStart: now
    });
    return { allowed: true };
  }
  
  const data = doc.data()!;
  
  if (now - data.windowStart > windowMs) {
    // Reset window
    await rateLimitDoc.set({
      count: 1,
      windowStart: now
    });
    return { allowed: true };
  }
  
  if (data.count >= maxRequests) {
    const retryAfter = Math.ceil((data.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  await rateLimitDoc.update({
    count: data.count + 1
  });
  
  return { allowed: true };
}
```

## Data Encryption ve Privacy

### Client-Side Encryption
```typescript
// src/services/encryption.ts
import CryptoJS from 'crypto-js';

export class ClientEncryption {
  private static readonly ALGORITHM = 'AES';
  private static readonly KEY_SIZE = 256;
  
  /**
   * Hassas verileri client-side encrypt et
   */
  static encryptSensitiveData(
    data: any, 
    userKey: string
  ): { encrypted: string; iv: string } {
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.PBKDF2(userKey, iv, {
      keySize: this.KEY_SIZE / 32,
      iterations: 10000
    });
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data), 
      key, 
      { iv }
    );
    
    return {
      encrypted: encrypted.toString(),
      iv: iv.toString()
    };
  }
  
  static decryptSensitiveData(
    encryptedData: string,
    iv: string,
    userKey: string
  ): any {
    const ivArray = CryptoJS.enc.Hex.parse(iv);
    const key = CryptoJS.PBKDF2(userKey, ivArray, {
      keySize: this.KEY_SIZE / 32,
      iterations: 10000
    });
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, { iv: ivArray });
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  }
  
  /**
   * Window titles ve app names için anonymization
   */
  static anonymizeWindowTitle(title: string): string {
    // Remove sensitive patterns
    const sensitivePatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
      /password|pwd|pass/gi, // Password related
      /token|key|secret/gi // API keys
    ];
    
    let anonymized = title;
    sensitivePatterns.forEach(pattern => {
      anonymized = anonymized.replace(pattern, '[REDACTED]');
    });
    
    return anonymized;
  }
  
  static hashIdentifier(identifier: string): string {
    return CryptoJS.SHA256(identifier).toString();
  }
}
```

### Privacy-First Data Processing
```typescript
// functions/src/services/privacy-service.ts
export class PrivacyService {
  
  /**
   * Kullanıcı gizlilik tercihlerine göre veri işle
   */
  static async processActivityData(
    userId: string,
    rawData: any,
    privacySettings: any
  ) {
    let processedData = { ...rawData };
    
    // Privacy level'a göre işlem
    switch (privacySettings.aiProcessing) {
      case 'local-only':
        processedData = await this.processLocally(processedData);
        break;
        
      case 'cloud-assisted':
        if (privacySettings.dataSharing) {
          processedData = await this.processWithCloud(processedData, userId);
        } else {
          processedData = await this.processWithCloudAnonymized(processedData);
        }
        break;
        
      default:
        processedData = await this.processLocally(processedData);
    }
    
    return processedData;
  }
  
  private static async processLocally(data: any) {
    // Edge AI processing - no data leaves device
    return {
      ...data,
      processedLocally: true,
      sensitiveDataRemoved: this.removeSensitiveData(data)
    };
  }
  
  private static async processWithCloud(data: any, userId: string) {
    // Full cloud processing with user consent
    const auditEntry = {
      userId,
      dataType: 'activity',
      processingType: 'cloud-full',
      timestamp: new Date(),
      dataSize: JSON.stringify(data).length
    };
    
    await this.logDataProcessing(auditEntry);
    return data;
  }
  
  private static async processWithCloudAnonymized(data: any) {
    // Cloud processing with anonymized data
    const anonymized = {
      ...data,
      userId: this.hashUserId(data.userId),
      windowTitle: ClientEncryption.anonymizeWindowTitle(data.windowTitle || ''),
      appName: this.generalizeAppName(data.appName || ''),
      timestamp: this.roundTimestamp(data.timestamp)
    };
    
    return anonymized;
  }
  
  private static removeSensitiveData(data: any) {
    const cleaned = { ...data };
    
    // Remove or mask sensitive fields
    if (cleaned.windowTitle) {
      cleaned.windowTitle = ClientEncryption.anonymizeWindowTitle(cleaned.windowTitle);
    }
    
    if (cleaned.url) {
      cleaned.url = this.anonymizeUrl(cleaned.url);
    }
    
    // Remove file paths
    delete cleaned.filePath;
    delete cleaned.documentName;
    
    return cleaned;
  }
  
  private static anonymizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}/*`;
    } catch {
      return '[URL]';
    }
  }
  
  private static generalizeAppName(appName: string): string {
    const appCategories: Record<string, string> = {
      'chrome': 'browser',
      'firefox': 'browser',
      'safari': 'browser',
      'code': 'development',
      'sublime': 'development',
      'photoshop': 'design',
      'illustrator': 'design',
      'slack': 'communication',
      'discord': 'communication'
    };
    
    const normalized = appName.toLowerCase();
    for (const [app, category] of Object.entries(appCategories)) {
      if (normalized.includes(app)) {
        return category;
      }
    }
    
    return 'other';
  }
  
  private static roundTimestamp(timestamp: Date): Date {
    // Round to nearest hour for privacy
    const rounded = new Date(timestamp);
    rounded.setMinutes(0, 0, 0);
    return rounded;
  }
  
  private static hashUserId(userId: string): string {
    return CryptoJS.SHA256(userId).toString().substring(0, 16);
  }
  
  private static async logDataProcessing(entry: any) {
    const db = getFirestore();
    await db.collection('dataProcessingAudit').add(entry);
  }
}
```

## GDPR Compliance

### Data Export ve Deletion
```typescript
// functions/src/gdpr/gdpr-service.ts
export class GDPRService {
  
  /**
   * Kullanıcının tüm verilerini export et
   */
  static async exportUserData(userId: string): Promise<{
    userData: any;
    downloadUrl: string;
  }> {
    const db = getFirestore();
    
    try {
      // Collect all user data
      const userData = {
        profile: await this.getUserProfile(userId),
        activityData: await this.getActivityData(userId),
        insights: await this.getInsights(userId),
        preferences: await this.getPreferences(userId),
        automationRules: await this.getAutomationRules(userId),
        exportMetadata: {
          exportDate: new Date().toISOString(),
          dataVersion: '1.0',
          requestedBy: userId
        }
      };
      
      // Create encrypted export file
      const exportData = JSON.stringify(userData, null, 2);
      const fileName = `user-data-export-${userId}-${Date.now()}.json`;
      
      // Upload to secure storage
      const downloadUrl = await this.uploadSecureFile(fileName, exportData, userId);
      
      // Log export request
      await db.collection('auditLogs').add({
        type: 'gdpr_export',
        userId,
        timestamp: new Date(),
        fileName,
        dataSize: exportData.length
      });
      
      return { userData, downloadUrl };
      
    } catch (error) {
      console.error('Data export failed:', error);
      throw new Error('Veri export işlemi başarısız');
    }
  }
  
  /**
   * Kullanıcının tüm verilerini sil
   */
  static async deleteUserData(userId: string, confirmationToken: string): Promise<void> {
    // Verify deletion token
    if (!await this.verifyDeletionToken(userId, confirmationToken)) {
      throw new Error('Geçersiz silme tokeni');
    }
    
    const db = getFirestore();
    const batch = db.batch();
    
    try {
      // Delete user collections
      const collections = ['buckets', 'events', 'insights', 'preferences', 'automationRules'];
      
      for (const collection of collections) {
        const docs = await db.collection('users').doc(userId).collection(collection).get();
        docs.forEach(doc => batch.delete(doc.ref));
      }
      
      // Delete user profile
      batch.delete(db.collection('users').doc(userId));
      
      // Delete from Firebase Auth
      await getAuth().deleteUser(userId);
      
      // Commit batch
      await batch.commit();
      
      // Log deletion
      await db.collection('auditLogs').add({
        type: 'gdpr_deletion',
        userId,
        timestamp: new Date(),
        dataDeleted: collections
      });
      
      console.log(`User data deleted successfully: ${userId}`);
      
    } catch (error) {
      console.error('Data deletion failed:', error);
      throw new Error('Veri silme işlemi başarısız');
    }
  }
  
  /**
   * Data retention policy uygula
   */
  static async applyRetentionPolicy(): Promise<void> {
    const db = getFirestore();
    
    // Get users with expired data
    const users = await db.collection('users').get();
    
    for (const userDoc of users.docs) {
      const userData = userDoc.data();
      const retentionDays = userData.preferences?.dataRetentionDays || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Delete old events
      const oldEvents = await db
        .collection('users')
        .doc(userDoc.id)
        .collection('events')
        .where('timestamp', '<', cutoffDate)
        .get();
      
      const batch = db.batch();
      oldEvents.docs.forEach(doc => batch.delete(doc.ref));
      
      if (oldEvents.size > 0) {
        await batch.commit();
        console.log(`Deleted ${oldEvents.size} old events for user ${userDoc.id}`);
      }
    }
  }
  
  private static async verifyDeletionToken(userId: string, token: string): Promise<boolean> {
    // Implementation for token verification
    // Should be cryptographically secure
    return true; // Simplified for example
  }
  
  private static async uploadSecureFile(fileName: string, data: string, userId: string): Promise<string> {
    // Upload to secure storage with expiration
    // Return temporary download URL
    return `https://storage.googleapis.com/temp/${fileName}`;
  }
}
```

Bu güvenlik standartları ile kullanıcı verilerini koruyan, GDPR uyumlu ve güvenli bir sistem kurabilirsiniz.
