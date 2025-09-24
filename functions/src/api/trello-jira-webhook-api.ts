import { onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { TrelloJiraService } from '../services/trello-jira-service';

const functions = require('firebase-functions');
const trelloJiraService = new TrelloJiraService();

/**
 * Trello ve Jira webhook olaylarını işleyen Firebase İşlevi.
 * Bu fonksiyon, gelen isteğin başlıklarına ve gövdesine göre kaynağı belirler
 * ve ilgili servis metodlarını çağırır.
 */
export const trelloJiraWebhookHandler = onRequest(async (request, response) => {
  console.log('Webhook isteği alındı.');

  // Webhook kaynağını belirlemek için başlıkları kontrol edin
  const userAgent = request.headers['user-agent'] || '';

  try {
    if (userAgent.includes('Trello')) {
      // Trello webhook'unu işleme
      const trelloEvent = request.body;
      console.log('Trello webhook olayı:', JSON.stringify(trelloEvent, null, 2));

      // TODO: Trello imza doğrulaması ekleyin (opsiyonel ancak önerilir)
      // const trelloSignature = request.headers['x-trello-webhook'];
      // if (!trelloSignature || !verifyTrelloSignature(request.rawBody, trelloSignature, functions.config().trello.secret)) {
      //   console.warn('Geçersiz Trello webhook imzası.');
      //   response.status(401).send('Geçersiz İmza');
      //   return;
      // }

      // Trello olay türüne göre işlem yapın (örneğin, kart güncellendi, taşındı)
      if (trelloEvent.action && trelloEvent.action.data && trelloEvent.action.data.card) {
        const cardId = trelloEvent.action.data.card.id;
        const newStatus = trelloEvent.action.display.translationKey; // Örnek: action_move_card_from_list_to_list

        console.log(`Trello kartı güncellendi: ${cardId}, Yeni Durum: ${newStatus}`);
        // TODO: Firestore'daki ilgili görevi güncelleyin
        // await trelloJiraService.updateTrelloTaskStatus(userId, cardId, { status: newStatus });
      }
    } else if (userAgent.includes('Jira')) {
      // Jira webhook'unu işleme
      const jiraEvent = request.body;
      console.log('Jira webhook olayı:', JSON.stringify(jiraEvent, null, 2));

      // TODO: Jira imza doğrulaması ekleyin (opsiyonel ancak önerilir)
      // const jiraSignature = request.headers['x-atlassian-signature'];

      // Jira olay türüne göre işlem yapın (örneğin, sorun güncellendi)
      if (
        jiraEvent.issue &&
        jiraEvent.issue.id &&
        jiraEvent.webhookEvent === 'jira:issue_updated'
      ) {
        const issueId = jiraEvent.issue.id;
        const newStatus = jiraEvent.issue.fields.status.name;

        console.log(`Jira sorunu güncellendi: ${issueId}, Yeni Durum: ${newStatus}`);
        // TODO: Firestore'daki ilgili görevi güncelleyin
        // await trelloJiraService.updateJiraTaskStatus(userId, issueId, { status: newStatus });
      }
    } else {
      console.warn('Bilinmeyen webhook kaynağı.', userAgent);
      response.status(400).send('Bilinmeyen Webhook Kaynağı');
      return;
    }

    response.status(200).send('Webhook başarıyla alındı.');
  } catch (error: any) {
    console.error('Webhook işlenirken hata oluştu:', error);
    response.status(500).send(`Webhook işlenirken hata oluştu: ${error.message}`);
  }
});

// TODO: Trello imza doğrulama fonksiyonunu buraya ekleyin
/*
function verifyTrelloSignature(rawBody: Buffer, signature: string, secret: string) {
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha1', secret).update(rawBody).digest('base64');
  return hash === signature;
}
*/
