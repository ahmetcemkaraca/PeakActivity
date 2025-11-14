import * as functions from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

interface UserProfile {
  subscriptionLevel: 'free' | 'paid_tier1' | 'paid_tier2';
  lastAgentGeneration?: admin.firestore.Timestamp;
}

// Her gün gece yarısı çalışacak zamanlanmış fonksiyon
export const scheduleAgentGeneration = onSchedule('every 24 hours', async (event) => {
  functions.logger.info('Ajan oluşturma zamanlanmış fonksiyonu başladı.', event);

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  for (const doc of snapshot.docs) {
    const userId = doc.id;
    const userProfile = doc.data() as UserProfile;

    if (userProfile.subscriptionLevel === 'free') {
      functions.logger.info(`Kullanıcı ${userId} ücretsiz, ajan oluşturma atlanıyor.`);
      continue;
    }

    const now = admin.firestore.Timestamp.now();
    let generate = false;
    const intervalDays = 2; // Ücretli kullanıcılar için varsayılan 2 gün

    if (userProfile.lastAgentGeneration) {
      const lastGenerationDate = userProfile.lastAgentGeneration.toDate();
      const nextGenerationTime = new Date(lastGenerationDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      if (now.toDate() >= nextGenerationTime) {
        generate = true;
      } else {
        functions.logger.info(`Kullanıcı ${userId} için bir sonraki ajan oluşturma zamanı henüz gelmedi.`);
      }
    } else {
      // Daha önce ajan oluşturulmamışsa, hemen oluştur
      generate = true;
    }

    if (generate) {
      // Kullanıcı etkinliğini kontrol et (son 24 saat içinde ActivityWatch verisi var mı?)
      const sevenDaysAgo = new Date(now.toDate().getTime() - 7 * 24 * 60 * 60 * 1000);
      const activitiesSnapshot = await db.collection(`users/${userId}/activities`)
        .where('timestamp', '>=', sevenDaysAgo)
        .limit(1)
        .get();

      if (activitiesSnapshot.empty) {
        functions.logger.info(`Kullanıcı ${userId} etkin değil, ajan oluşturma atlanıyor.`);
        continue;
      }

      functions.logger.info(`Kullanıcı ${userId} için ajan oluşturma tetikleniyor.`);
      try {
        // generateAgent fonksiyonunu doğrudan çağırmak yerine, HTTP isteği ile tetikleyeceğiz.
        // Firebase Fonksiyonları içinden başka bir HTTP tetikleyicili fonksiyonu doğrudan çağırmak yerine,
        // aynı projede çalıştığı varsayılarak HTTP isteği daha uygun olacaktır.
        const awServerUrl = functions.config().aw_server?.url || 'http://localhost:5000';
        const geminiApiKey = functions.config().gemini?.api_key;

        if (!geminiApiKey) {
          functions.logger.error('Gemini API key is not configured for scheduled agent generation.');
          continue; // Bu kullanıcı için atla
        }

        // Örnek bir ajan yapılandırması - bunu kullanıcının ayarlarına göre dinamik hale getirmek gerekecek
        const agentConfig = {
          agent_config_data: `
# Dinamik Olarak Oluşturulan Ajan Yapılandırması
agents:
  - name: ScheduledProductivityAgent
    role: Zamanlanmış verimlilik uzmanı
    goal: Kullanıcının genel üretkenliğini ve odaklanma alışkanlıklarını analiz et
    backstory: Periyodik olarak ActivityWatch verilerini değerlendirir ve verimlilik artırıcı içgörüler sunar.
    tools: []
tasks:
  - name: PeriodicActivityAnalysis
    agent: ScheduledProductivityAgent
    description: Son ${intervalDays} gündeki kullanıcı aktivite verilerini analiz et ve bir özet rapor oluştur.
    expected_output: "Periyodik aktivite analizi ve içgörü raporu."
          `,
          topic: `Periyodik üretkenlik analizi ve içgörü oluştur: ${now.toDate().toISOString()}`,
        };

        await axios.post(
          `${awServerUrl}/api/0/agents/generate`,
          agentConfig,
          {
            headers: {
              'X-Gemini-Api-Key': geminiApiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        // Ajan oluşturma başarıyla tetiklendikten sonra son oluşturma zamanını güncelle
        await usersRef.doc(userId).update({
          lastAgentGeneration: now,
        });

        functions.logger.info(`Kullanıcı ${userId} için ajan oluşturma başarıyla tetiklendi.`);
      } catch (error: any) {
        functions.logger.error(`Kullanıcı ${userId} için ajan oluşturma sırasında hata:`, error.message);
      }
    }
  }
}); 