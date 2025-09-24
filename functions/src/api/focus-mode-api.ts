import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FocusModeService } from '../services/focus-mode-service';

const focusModeService = new FocusModeService();

/**
 * Firebase Function to create a new focus mode.
 */
export const createFocusMode = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { name, description, configuration } = request.data;

  if (!name || !configuration) {
    throw new HttpsError('invalid-argument', 'Gerekli alanlar eksik: isim, konfigürasyon.');
  }

  try {
    const newMode = await focusModeService.createFocusMode(userId, {
      name,
      description,
      configuration,
    });
    return { success: true, focusMode: newMode };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to get a specific focus mode.
 */
export const getFocusMode = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { modeId } = request.data;

  if (!modeId) {
    throw new HttpsError('invalid-argument', 'Mod kimliği eksik.');
  }

  try {
    const mode = await focusModeService.getFocusMode(userId, modeId);
    if (!mode) {
      throw new HttpsError('not-found', 'Odaklanma modu bulunamadı.');
    }
    return { success: true, focusMode: mode };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to update an existing focus mode.
 */
export const updateFocusMode = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { modeId, updates } = request.data;

  if (!modeId || !updates) {
    throw new HttpsError('invalid-argument', 'Mod kimliği veya güncellemeler eksik.');
  }

  try {
    const updatedMode = await focusModeService.updateFocusMode(userId, modeId, updates);
    if (!updatedMode) {
      throw new HttpsError('not-found', 'Güncellenecek odaklanma modu bulunamadı.');
    }
    return { success: true, focusMode: updatedMode };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to delete a specific focus mode.
 */
export const deleteFocusMode = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { modeId } = request.data;

  if (!modeId) {
    throw new HttpsError('invalid-argument', 'Mod kimliği eksik.');
  }

  try {
    const success = await focusModeService.deleteFocusMode(userId, modeId);
    if (!success) {
      throw new HttpsError('not-found', 'Silinecek odaklanma modu bulunamadı.');
    }
    return { success: true, message: 'Odaklanma modu başarıyla silindi.' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to list all focus modes for a user.
 */
export const listFocusModes = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;

  try {
    const modes = await focusModeService.listFocusModes(userId);
    return { success: true, modes };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to set a specific focus mode as active for a user.
 */
export const setActiveFocusMode = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { modeId } = request.data;

  if (!modeId) {
    throw new HttpsError('invalid-argument', 'Mod kimliği eksik.');
  }

  try {
    const activeMode = await focusModeService.setActiveFocusMode(userId, modeId);
    if (!activeMode) {
      throw new HttpsError('not-found', 'Aktif edilecek odaklanma modu bulunamadı.');
    }
    return { success: true, focusMode: activeMode };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});
