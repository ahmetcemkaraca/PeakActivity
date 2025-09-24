import { db } from '../firebaseAdmin';
import { ActivityEvent } from '../types/activity-event.d';

export interface QueryOptions {
  userId: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  keywords?: string[];
  categories?: string[];
  appNames?: string[];
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  limit?: number;
  offset?: number;
}

export interface QueryResult {
  events: ActivityEvent[];
  totalCount: number;
}

export class ActivityQueryService {
  /**
   * Kullanıcı etkinlik verilerini gelişmiş filtreleme ve arama seçenekleriyle sorgular.
   * @param options Sorgulama seçenekleri.
   * @returns Filtrelenmiş etkinlikler ve toplam sayı.
   */
  public async queryActivities(options: QueryOptions): Promise<QueryResult> {
    const {
      userId,
      startDate,
      endDate,
      keywords,
      categories,
      appNames,
      minDurationSeconds,
      maxDurationSeconds,
      limit = 100, // Varsayılan limit
      offset = 0,
    } = options;

    let query: FirebaseFirestore.Query = db.collection(`users/${userId}/activityEvents`);

    // Tarih aralığı filtreleri
    if (startDate) {
      query = query.where('timestamp_start', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp_start', '<=', endDate + 'T23:59:59.999Z'); // Gün sonuna kadar
    }

    // Kategori filtreleri (çoklu kategori desteklenir)
    if (categories && categories.length > 0) {
      // Firestore'da 'in' operatörü, verilen dizideki herhangi bir değerle eşleşen belgeleri sorgulamak için kullanılır.
      // 'in' operatörü ile en fazla 10 argüman sorgulanabilir. Daha fazlası için birden fazla sorgu veya farklı bir yaklaşım gerekebilir.
      query = query.where('category', 'in', categories);
    }

    // Uygulama adı filtreleri (çoklu uygulama desteklenir)
    if (appNames && appNames.length > 0) {
      query = query.where('app', 'in', appNames);
    }

    // Süre filtreleri
    if (minDurationSeconds !== undefined) {
      query = query.where('duration_sec', '>=', minDurationSeconds);
    }
    if (maxDurationSeconds !== undefined) {
      query = query.where('duration_sec', '<=', maxDurationSeconds);
    }

    // Sıralama (en yeni etkinlikler önce gelsin)
    query = query.orderBy('timestamp_start', 'desc');

    // Toplam sayıyı almak için ayrı bir sorgu
    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    // Sayfalama
    if (offset > 0) {
      query = query.offset(offset);
    }
    if (limit > 0) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    let events: ActivityEvent[] = snapshot.docs.map(doc => doc.data() as ActivityEvent);

    // Anahtar kelime filtrelemesi (şimdilik istemci tarafında veya sunucu tarafında manuel filtreleme)
    // NOT: Firestore doğrudan tam metin aramayı desteklemez. Büyük veri setleri için, bu işlem maliyetli olabilir
    // ve özel bir arama çözümü (örn. Algolia, ElasticSearch) veya Firebase Extensions gibi
    // bir üçüncü taraf entegrasyonu gerektirebilir.
    // Şu anki implementasyon, veritabanından çekilen tüm veriler üzerinde bellek içi filtreleme yapar.
    if (keywords && keywords.length > 0) {
      const lowerCaseKeywords = keywords.map(kw => kw.toLowerCase());
      events = events.filter(event => {
        const searchableText =
          `${event.title || ''} ${event.app || ''} ${event.url || ''} ${event.category || ''}`.toLowerCase();
        return lowerCaseKeywords.some(kw => searchableText.includes(kw));
      });
    }

    return {
      events,
      totalCount,
    };
  }
}
