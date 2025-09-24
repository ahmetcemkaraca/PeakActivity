import * as functions from 'firebase-functions';

interface ContextualCategorizationInput {
  context: string;
  language?: string; // ISO 639-1 kodu (örn: "en", "tr")
}

interface ContextualCategorizationOutput {
  category: string;
  confidence: number;
  rationale: string;
}

export class ContextualCategorizationService {
  private readonly LABELS = [
    'coding',
    'design',
    'research',
    'social',
    'news',
    'entertainment',
    'communication',
    'shopping',
  ];

  // Gelişmiş anahtar kelime tabanlı sınıflandırma (LLM simülasyonu)
  private readonly KEYWORD_GROUPS: { [category: string]: string[] } = {
    coding: [
      'code',
      'github',
      'stack overflow',
      'css',
      'html',
      'javascript',
      'python',
      'develop',
      'programming',
      'vscode',
      'intellij',
      'bug',
    ],
    design: ['figma', 'photoshop', 'illustrator', 'design', 'ui', 'ux', 'blender', 'sketch'],
    research: ['wiki', 'article', 'study', 'research', 'paper', 'learn', 'scholar', 'analyze'],
    social: ['facebook', 'twitter', 'instagram', 'linkedin', 'reddit', 'chat', 'meet', 'discord'],
    news: ['cnn', 'bbc', 'haber', 'gündem', 'news', 'makale'],
    entertainment: ['movie', 'film', 'youtube', 'netflix', 'oyun', 'game', 'dizi', 'müzik'],
    communication: ['email', 'outlook', 'gmail', 'slack', 'teams', 'zoom', 'call'],
    shopping: ['shop', 'buy', 'amazon', 'trendyol', 'n11', 'satın al'],
  };

  /**
   * Bağlamsal bilgiyi kullanarak kategorizasyon yapar.
   * LLM tabanlı sıfır atışlı sınıflandırmayı simüle eder.
   * @param input Kategorize edilecek bağlam ve dil bilgisi.
   * @returns Kategorizasyon sonucunu içeren çıktı nesnesi.
   */
  public categorizeContext(input: ContextualCategorizationInput): ContextualCategorizationOutput {
    const text = input.context.toLowerCase();
    let scores: { [category: string]: number } = {};
    this.LABELS.forEach(label => (scores[label] = 0));

    // 1. Dil algılama ve çeviri simülasyonu (şimdilik doğrudan LLM çağrısı yapılamadığı için basitleştirildi)
    // Gerçek bir senaryoda, bu adım için bir dil algılama ve çeviri servisi kullanılmalıdır.
    const processedText = text; // Varsayılan olarak İngilizce veya zaten işlenmiş kabul ediliyor

    let relevantKeywords: { [category: string]: string[] } = {};

    // Her kategori için anahtar kelime eşleştirmesi ile puanlama
    for (const label of this.LABELS) {
      for (const keyword of this.KEYWORD_GROUPS[label] || []) {
        if (processedText.includes(keyword)) {
          scores[label]++;
          if (!relevantKeywords[label]) relevantKeywords[label] = [];
          relevantKeywords[label].push(keyword);
        }
      }
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    let assignedCategory: string = 'other';
    let confidence = 0.5;
    let rationale = 'Belirlenen anahtar kelime bulunamadı.';

    if (totalScore > 0) {
      // En yüksek puanlı kategoriyi bul
      let maxScore = -1;
      for (const label of this.LABELS) {
        if (scores[label] > maxScore) {
          maxScore = scores[label];
          assignedCategory = label;
        }
      }

      // Güven oranını hesapla (basit softmax benzeri)
      confidence = maxScore / totalScore;

      // Gerekçe oluştur
      if (relevantKeywords[assignedCategory] && relevantKeywords[assignedCategory].length > 0) {
        const keywordsStr = relevantKeywords[assignedCategory].join(', ');
        rationale = `Anahtar kelimeler içeriyor: ${keywordsStr}. Kategoriye işaret ediyor: ${assignedCategory}.`;
      } else {
        rationale = `Bağlam ilgili: ${assignedCategory}.`;
      }
    }

    return {
      category: assignedCategory,
      confidence: parseFloat(confidence.toFixed(2)),
      rationale: rationale.substring(0, 140), // 140 karakterle sınırlı
    };
  }
}
