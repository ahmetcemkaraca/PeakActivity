import { db } from '../firebaseAdmin';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - trello.js types may be incomplete
import { TrelloClient } from 'trello.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - jira-client has no type declarations
import JiraApi from 'jira-client';
import { TrelloCredentialsEncryption } from './encryption/TrelloCredentialsEncryption';
import { JiraCredentialsEncryption } from './encryption/JiraCredentialsEncryption';
import { ExternalCredential } from '../types/external-credentials';

export class TrelloJiraService {
  private db: any;
  private trelloClients: Map<string, any>;
  private jiraClients: Map<string, any>;
  private trelloEncryptionService: TrelloCredentialsEncryption;
  private jiraEncryptionService: JiraCredentialsEncryption;

  constructor(
    trelloEncryptionService: TrelloCredentialsEncryption,
    jiraEncryptionService: JiraCredentialsEncryption
  ) {
    this.db = db;
    this.trelloClients = new Map();
    this.jiraClients = new Map();
    this.trelloEncryptionService = trelloEncryptionService;
    this.jiraEncryptionService = jiraEncryptionService;
  }

  private async getTrelloClient(userId: string) {
    if (this.trelloClients.has(userId)) {
      return this.trelloClients.get(userId);
    }

    const encryptedTrelloCredentials = await this.trelloEncryptionService.getEncryptedCredentials(
      userId,
      'trello'
    );

    if (!encryptedTrelloCredentials) {
      throw new Error('Trello kimlik bilgileri bulunamadı. Lütfen entegrasyonu yapılandırın.');
    }

    const decryptedTrelloCredentials = await this.trelloEncryptionService.decrypt(
      encryptedTrelloCredentials.encryptedPayload,
      encryptedTrelloCredentials.encryptionMetadata
    );

    const trelloClient = new TrelloClient({
      key: decryptedTrelloCredentials.apiKey,
      token: decryptedTrelloCredentials.token,
    });
    this.trelloClients.set(userId, trelloClient);
    return trelloClient;
  }

  private async getJiraClient(userId: string) {
    if (this.jiraClients.has(userId)) {
      return this.jiraClients.get(userId);
    }

    const encryptedJiraCredentials = await this.jiraEncryptionService.getEncryptedCredentials(
      userId,
      'jira'
    );

    if (!encryptedJiraCredentials) {
      throw new Error('Jira kimlik bilgileri bulunamadı. Lütfen entegrasyonu yapılandırın.');
    }

    const decryptedJiraCredentials = await this.jiraEncryptionService.decrypt(
      encryptedJiraCredentials.encryptedPayload,
      encryptedJiraCredentials.encryptionMetadata
    );

    const jiraClient = new JiraApi({
      protocol: 'https',
      host: decryptedJiraCredentials.host,
      username: decryptedJiraCredentials.username,
      password: decryptedJiraCredentials.password,
      apiVersion: '2',
      strictSSL: true,
    });
    this.jiraClients.set(userId, jiraClient);
    return jiraClient;
  }

  /**
   * Trello'dan görev durumunu getirir.
   * @param userId Kullanıcının Firebase UID'si.
   * @param taskId Getirilecek Trello görevinin ID'si.
   * @returns Trello görev durumu bilgileri.
   */
  async getTrelloTaskStatus(userId: string, taskId: string) {
    try {
      const trelloClient: any = await this.getTrelloClient(userId);
      const card: any = await trelloClient.cards.getCard(taskId as any);
      return {
        taskId: taskId,
        status: card?.dueComplete ? 'completed' : 'pending',
        name: card?.name,
        due: card?.due,
      };
    } catch (error: any) {
      console.error(`Trello görev durumu getirilirken hata oluştu (${taskId}):`, error);
      throw new Error(`Trello görev durumu getirilemedi: ${error.message}`);
    }
  }

  /**
   * Jira'dan görev durumunu getirir.
   * @param userId Kullanıcının Firebase UID'si.
   * @param issueId Getirilecek Jira görevinin ID'si (issue ID).
   * @returns Jira görev durumu bilgileri.
   */
  async getJiraTaskStatus(userId: string, issueId: string) {
    try {
      const jiraClient: any = await this.getJiraClient(userId);
      const issue: any = await jiraClient.findIssue(issueId as any);
      return {
        issueId: issueId,
        status: issue?.fields?.status?.name,
        summary: issue?.fields?.summary,
        dueDate: issue?.fields?.duedate,
      };
    } catch (error: any) {
      console.error(`Jira görev durumu getirilirken hata oluştu (${issueId}):`, error);
      throw new Error(`Jira görev durumu getirilemedi: ${error.message}`);
    }
  }

  /**
   * Trello'da bir görevin durumunu günceller.
   * @param userId Kullanıcının Firebase UID'si.
   * @param cardId Güncellenecek Trello kartının ID'si.
   * @param updates Güncelleme verileri (örn: { dueComplete: true }).
   * @returns Güncellenen Trello kartı bilgileri.
   */
  async updateTrelloTaskStatus(userId: string, cardId: string, updates: any) {
    try {
      const trelloClient: any = await this.getTrelloClient(userId);
      const updatedCard: any = await trelloClient.cards.updateCard({
        id: cardId,
        ...updates,
      } as any);
      return { cardId: cardId, success: true, updatedCard };
    } catch (error: any) {
      console.error(`Trello görev durumu güncellenirken hata oluştu (${cardId}):`, error);
      throw new Error(`Trello görev durumu güncellenemedi: ${error.message}`);
    }
  }

  /**
   * Jira'da bir görevin durumunu günceller.
   * @param userId Kullanıcının Firebase UID'si.
   * @param issueId Güncellenecek Jira görevinin ID'si (issue ID).
   * @param updates Güncelleme verileri (örn: { fields: { status: { name: "Done" } } }).
   * @returns Güncellenen Jira görevi bilgileri.
   */
  async updateJiraTaskStatus(userId: string, issueId: string, updates: any) {
    try {
      const jiraClient = await this.getJiraClient(userId);
      const updatedIssue = await jiraClient.updateIssue(issueId, updates);
      return { issueId: issueId, success: true, updatedIssue };
    } catch (error: any) {
      console.error(`Jira görev durumu güncellenirken hata oluştu (${issueId}):`, error);
      throw new Error(`Jira görev durumu güncellenemedi: ${error.message}`);
    }
  }

  /**
   * Trello'dan bir panonun (projenin) ilerlemesini getirir.
   * @param userId Kullanıcının Firebase UID'si.
   * @param boardId Getirilecek Trello panosunun ID'si.
   * @returns Trello panosu ilerleme bilgileri.
   */
  async getTrelloProjectProgress(userId: string, boardId: string) {
    try {
      const trelloClient: any = await this.getTrelloClient(userId);
      const board: any = await trelloClient.boards.getBoard(boardId as any);
      const lists: any[] = await trelloClient.boards.getLists(
        boardId as any,
        { filter: 'all' } as any
      );

      let totalCards = 0;
      let completedCards = 0;

      // Kullanıcının Trello ayarlarından tamamlanmış liste adlarını al
      const userConfigDoc = await this.db
        .collection('users')
        .doc(userId)
        .collection('integrations')
        .doc('trello')
        .get();
      const completedListNames: string[] = userConfigDoc.data()?.completedListNames || [
        'done',
        'tamamlandı',
        'completed',
      ]; // Varsayılan değerler

      for (const list of lists) {
        const cards: any[] = await trelloClient.lists.getCards(list.id as any);
        totalCards += cards.length;

        if (completedListNames.includes(list.name.toLowerCase())) {
          completedCards += cards.length;
        }
      }

      const progressPercentage = totalCards === 0 ? 0 : (completedCards / totalCards) * 100;

      return {
        boardId: boardId,
        name: board?.name,
        totalCards,
        completedCards,
        progressPercentage,
        status: board?.closed ? 'closed' : 'open',
      };
    } catch (error: any) {
      console.error(`Trello proje ilerlemesi getirilirken hata oluştu (${boardId}):`, error);
      throw new Error(`Trello proje ilerlemesi getirilemedi: ${error.message}`);
    }
  }

  /**
   * Jira'dan bir projenin ilerlemesini getirir.
   * @param userId Kullanıcının Firebase UID'si.
   * @param projectId Getirilecek Jira projesinin ID'si.
   * @returns Jira projesi ilerleme bilgileri.
   */
  async getJiraProjectProgress(userId: string, projectId: string) {
    try {
      const jiraClient = await this.getJiraClient(userId);
      // Jira projeleri için doğrudan bir "progress" alanı olmayabilir.
      // Genellikle sorunların durumlarına göre ilerleme hesaplanır.
      const jql = `project = ${projectId}`;
      const searchResults = await jiraClient.searchJira(jql, {
        maxResults: 1000, // Yeterli sayıda sonuç almak için
        fields: ['status'], // Sadece durum alanını getir
      });

      let totalIssues = searchResults.total;
      let completedIssues = 0;

      // Kullanıcının Jira ayarlarından tamamlanmış durum adlarını al
      const userConfigDoc = await this.db
        .collection('users')
        .doc(userId)
        .collection('integrations')
        .doc('jira')
        .get();
      const completedStatuses: string[] = userConfigDoc.data()?.completedStatuses || [
        'Done',
        'Closed',
        'Resolved',
      ]; // Varsayılan değerler

      for (const issue of searchResults.issues) {
        if (completedStatuses.includes(issue.fields.status.name)) {
          completedIssues++;
        }
      }

      const progressPercentage = totalIssues === 0 ? 0 : (completedIssues / totalIssues) * 100;

      return {
        projectId: projectId,
        totalIssues,
        completedIssues,
        progressPercentage,
        status: 'open',
      };
    } catch (error: any) {
      console.error(`Jira proje ilerlemesi getirilirken hata oluştu (${projectId}):`, error);
      throw new Error(`Jira proje ilerlemesi getirilemedi: ${error.message}`);
    }
  }
}
