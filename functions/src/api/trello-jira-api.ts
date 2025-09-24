import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { TrelloJiraService } from '../services/trello-jira-service';

const trelloJiraService = new TrelloJiraService();

/**
 * Trello'dan bir görevin durumunu getiren Firebase İşlevi.
 */
export const getTrelloTaskStatus = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { taskId } = request.data;

  if (!taskId) {
    throw new HttpsError('invalid-argument', "Görev ID'si gereklidir.");
  }

  try {
    const status = await trelloJiraService.getTrelloTaskStatus(userId, taskId);
    return { success: true, status };
  } catch (error: any) {
    console.error('Trello görev durumu getirilirken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Trello görev durumu getirilirken bilinmeyen bir hata oluştu.'
    );
  }
});

/**
 * Jira'dan bir görevin durumunu getiren Firebase İşlevi.
 */
export const getJiraTaskStatus = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { taskId } = request.data;

  if (!taskId) {
    throw new HttpsError('invalid-argument', "Görev ID'si gereklidir.");
  }

  try {
    const status = await trelloJiraService.getJiraTaskStatus(userId, taskId);
    return { success: true, status };
  } catch (error: any) {
    console.error('Jira görev durumu getirilirken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Jira görev durumu getirilirken bilinmeyen bir hata oluştu.'
    );
  }
});

/**
 * Trello'da bir görevin durumunu güncelleyen Firebase İşlevi.
 */
export const updateTrelloTaskStatus = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { cardId, updates } = request.data;

  if (!cardId || !updates) {
    throw new HttpsError('invalid-argument', "Kart ID'si ve güncellemeler gereklidir.");
  }

  try {
    const updatedCard = await trelloJiraService.updateTrelloTaskStatus(userId, cardId, updates);
    return { success: true, updatedCard };
  } catch (error: any) {
    console.error('Trello görev durumu güncellenirken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Trello görev durumu güncellenirken bilinmeyen bir hata oluştu.'
    );
  }
});

/**
 * Jira'da bir görevin durumunu güncelleyen Firebase İşlevi.
 */
export const updateJiraTaskStatus = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { issueId, updates } = request.data;

  if (!issueId || !updates) {
    throw new HttpsError('invalid-argument', "Issue ID'si ve güncellemeler gereklidir.");
  }

  try {
    const updatedIssue = await trelloJiraService.updateJiraTaskStatus(userId, issueId, updates);
    return { success: true, updatedIssue };
  } catch (error: any) {
    console.error('Jira görev durumu güncellenirken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Jira görev durumu güncellenirken bilinmeyen bir hata oluştu.'
    );
  }
});

/**
 * Trello'dan bir panonun (projenin) ilerlemesini getiren Firebase İşlevi.
 */
export const getTrelloProjectProgress = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { boardId } = request.data;

  if (!boardId) {
    throw new HttpsError('invalid-argument', "Pano ID'si gereklidir.");
  }

  try {
    const progress = await trelloJiraService.getTrelloProjectProgress(userId, boardId);
    return { success: true, progress };
  } catch (error: any) {
    console.error('Trello proje ilerlemesi getirilirken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Trello proje ilerlemesi getirilirken bilinmeyen bir hata oluştu.'
    );
  }
});

/**
 * Jira'dan bir projenin ilerlemesini getiren Firebase İşlevi.
 */
export const getJiraProjectProgress = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { projectId } = request.data;

  if (!projectId) {
    throw new HttpsError('invalid-argument', "Proje ID'si gereklidir.");
  }

  try {
    const progress = await trelloJiraService.getJiraProjectProgress(userId, projectId);
    return { success: true, progress };
  } catch (error: any) {
    console.error('Jira proje ilerlemesi getirilirken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Jira proje ilerlemesi getirilirken bilinmeyen bir hata oluştu.'
    );
  }
});
