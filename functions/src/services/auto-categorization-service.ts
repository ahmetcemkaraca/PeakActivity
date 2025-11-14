import { z } from 'zod';

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
    // Call keyword-based categorization function
    const result = await autoCategorizeFlow(events);
    return result;
  }
}

/**
 * Automatic categorization using keyword-based classification
 * GenKit AI features temporarily disabled for compatibility
 */
export async function autoCategorizeFlow(events: ActivityEvent[]): Promise<AutoCategorizationOutput> {
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

      // AI-based categorization temporarily disabled (GenKit compatibility issue)
      // Using keyword-based classification only
      // For AI enhancement, use ai-analysis-api.ts with custom prompts
      
      if (confidence < 0.5 || assignedCategory === 'uncategorized') {
        // Apply secondary heuristics for better categorization
        const appLower = event.app.toLowerCase();
        
        // Browser apps -> check URL domain
        if (appLower.includes('chrome') || appLower.includes('firefox') || appLower.includes('safari')) {
          if (event.url) {
            const urlLower = event.url.toLowerCase();
            if (urlLower.includes('github') || urlLower.includes('stackoverflow')) {
              assignedCategory = 'coding';
              confidence = 0.6;
            } else if (urlLower.includes('youtube') || urlLower.includes('netflix')) {
              assignedCategory = 'entertainment';
              confidence = 0.6;
            }
          }
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