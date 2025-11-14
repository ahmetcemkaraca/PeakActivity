import { genkit } from '@genkit-ai/core';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

const genkitApp = genkit({
  plugins: [
    googleAI(),
  ],
});

interface ActivityEvent {
  app: string;
  title: string;
  url: string;
}

interface LabelResult {
  index: number;
  category: string;
  confidence: number;
}

interface AutoCategorizationOutput {
  labels: LabelResult[];
}

// Zod şemalarını tanımla
const ActivityEventSchema = z.object({
  app: z.string(),
  title: z.string(),
  url: z.string(),
});

const LabelResultSchema = z.object({
  index: z.number(),
  category: z.string(),
  confidence: z.number(),
});

const AutoCategorizationOutputSchema = z.object({
  labels: z.array(LabelResultSchema),
});

// Sabitleri sınıf dışına taşı
const TAXONOMY = [
  'coding',
  'design',
  'research',
  'social',
  'gaming',
  'productivity',
  'communication',
  'education',
  'entertainment',
  'news',
  'shopping',
  'uncategorized',
];

// Basitleştirilmiş anahtar kelime tabanlı kategorizasyon ve uygulama eşleştirmeleri
const KEYWORD_MAPPINGS: { [key: string]: string[] } = {
  'coding': ['code', 'github', 'stackoverflow', 'vscode', 'intellij', 'bug', 'develop', 'programming', 'jira', 'gitlab'],
  'design': ['photoshop', 'figma', 'sketch', 'design', 'ui', 'ux', 'illustrator', 'blender'],
  'research': ['wiki', 'scholar', 'research', 'article', 'paper', 'learn', 'study', 'analyze'],
  'social': ['facebook', 'twitter', 'linkedin', 'instagram', 'social', 'chat', 'meet', 'discord'],
  'gaming': ['game', 'steam', 'epic', 'play', 'fortnite', 'lol'],
  'productivity': ['todo', 'task', 'notion', 'jira', 'asana', 'excel', 'docs', 'word', 'powerpoint'],
  'communication': ['email', 'outlook', 'gmail', 'slack', 'teams', 'zoom', 'call'],
  'education': ['udemy', 'coursera', 'edx', 'lesson', 'course', 'school', 'university'],
  'entertainment': ['youtube', 'netflix', 'twitch', 'movie', 'film', 'music', 'spotify'],
  'news': ['haber', 'news', 'gündem', 'cnn', 'bbc', 'aljazeera'],
  'shopping': ['amazon', 'ebay', 'trendyol', 'n11', 'hepsiburada', 'shop'],
};

const APP_MAPPINGS: { [key: string]: string } = {
  'code.exe': 'coding',
  'photoshop.exe': 'design',
  'chrome.exe': 'uncategorized', // Chrome gibi genel uygulamalar AI tarafından daha iyi belirlenmeli
  'discord.exe': 'social',
  'steam.exe': 'gaming',
  'outlook.exe': 'communication',
  'excel.exe': 'productivity',
  'slack.exe': 'communication',
  'msedge.exe': 'uncategorized',
  'firefox.exe': 'uncategorized',
  'teams.exe': 'communication',
};

const keywordRegexes: Map<string, RegExp[]> = new Map();

for (const category in KEYWORD_MAPPINGS) {
  const regexes: RegExp[] = [];
  for (const keyword of KEYWORD_MAPPINGS[category]) {
    regexes.push(new RegExp(`\\b${keyword}\\b`, 'gi'));
  }
  keywordRegexes.set(category, regexes);
}

export class AutoCategorizationService {
  /**
   * Otomatik kategorizasyon ve etiketleme işlemi.
   * GenKit ve AI modeli entegrasyonu için akış olarak yeniden düzenlendi.
   * @param events Kategorize edilecek etkinlikler dizisi.
   * @returns Etiketlenmiş etkinlikleri içeren bir çıktı nesnesi.
   */
  public async categorizeEvents(events: ActivityEvent[]): Promise<AutoCategorizationOutput> {
    // GenKit akışını çağır
    const result = await autoCategorizeFlow({ events });
    return result;
  }
}

// GenKit otomatik kategorizasyon akışı
export const autoCategorizeFlow = genkitApp.defineFlow(
  {
    name: 'autoCategorize',
    inputSchema: z.object({ events: z.array(ActivityEventSchema) }),
    outputSchema: AutoCategorizationOutputSchema,
  },
  async ({ events }: { events: ActivityEvent[] }) => {
    const labels: LabelResult[] = [];
    // Artık servis örneğine gerek yok, doğrudan sabitlere erişilebilir

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const titleDomain = `${event.title.toLowerCase()} ${new URL(event.url).hostname.toLowerCase()}`;
      const appName = event.app.toLowerCase();

      let assignedCategory: string | null = null;
      let confidence = 0;

      // Önce mevcut anahtar kelime tabanlı mantıkla dene
      let scores: { [category: string]: number } = {};
      TAXONOMY.forEach(category => (scores[category] = 0));

      for (const category of TAXONOMY) {
        const regexes = keywordRegexes.get(category);
        if (regexes) {
          for (const regex of regexes) {
            const matches = titleDomain.match(regex);
            if (matches) {
              scores[category] += matches.length;
            }
          }
        }
      }

      if (APP_MAPPINGS[appName]) {
        scores[APP_MAPPINGS[appName]] += 3;
      }

      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      if (totalScore > 0) {
        const expScores: { [category: string]: number } = {};
        TAXONOMY.forEach(category => {
          expScores[category] = Math.exp(scores[category]);
        });

        const sumExpScores = Object.values(expScores).reduce((sum, val) => sum + val, 0);

        let maxProb = 0;
        for (const category of TAXONOMY) {
          const prob = expScores[category] / sumExpScores;
          if (prob > maxProb) {
            maxProb = prob;
            assignedCategory = category;
          }
        }
        confidence = maxProb;
      } else {
        assignedCategory = 'uncategorized';
        confidence = 0;
      }

      // Eğer mevcut mantıkla tatmin edici bir sonuç bulunamazsa veya AI'dan daha iyi bir tahmin isteniyorsa
      // AI modelini kullan
      if (confidence < 0.7 || assignedCategory === 'uncategorized') { // Güven eşiği ayarlanabilir
        try {
          const eventUrlHostname = event.url ? new URL(event.url).hostname : '';
          const prompt = `Aşağıdaki etkinliği en uygun kategoriye ayırın. Mevcut kategoriler: ${TAXONOMY.join(', ')}. Etkinlik uygulaması: ${event.app}, başlık: ${event.title}, URL/Alan Adı: ${eventUrlHostname}. Sadece tek bir kategori adı döndürün.`;
          const { text } = await genkitApp.generate({
            model: googleAI.model('gemini-2.5-flash'),
            prompt: prompt,
            config: {
              temperature: 0.2,
            },
          });

          const aiCategory = text.trim().toLowerCase();
          // AI tarafından döndürülen kategorinin TAXONOMY içinde olup olmadığını kontrol et
          if (TAXONOMY.includes(aiCategory)) {
            assignedCategory = aiCategory;
            confidence = 0.8; // AI tahmini için daha yüksek güven atayabiliriz
          } else {
            // Eğer AI geçerli bir kategori döndürmezse, tekrar uncategorized'a dön veya varsayılan bir kategori ata
            assignedCategory = 'uncategorized';
            confidence = 0.5;
          }
        } catch (error) {
          console.error("GenKit AI kategorizasyon sırasında hata oluştu:", error);
          assignedCategory = 'uncategorized'; // Hata durumunda varsayılan
          confidence = 0.3;
        }
      }
      
      labels.push({
        index: i,
        category: assignedCategory as string,
        confidence: parseFloat(confidence.toFixed(2)),
      });
    }

    return { labels };
  }
); 