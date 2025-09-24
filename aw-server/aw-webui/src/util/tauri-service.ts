import { invoke } from '@tauri-apps/api/tauri';
import type { ActivityEvent } from '../types/activity';

export class TauriService {
  /**
   * Aktivite verilerini yerel veritabanından alır
   */
  static async getActivityData(startTime: number, endTime: number): Promise<ActivityEvent[]> {
    try {
      const data = await invoke<ActivityEvent[]>('get_activity_data', {
        startTime,
        endTime,
      });
      return data;
    } catch (error) {
      console.error('Aktivite verisi alınamadı:', error);
      throw new Error(`Tauri komutu başarısız: ${error}`);
    }
  }

  /**
   * Firebase'e veri senkronizasyonu
   */
  static async syncToFirebase(events: ActivityEvent[], userToken: string): Promise<boolean> {
    // Büyük veri setlerini chunk'lara böl
    const CHUNK_SIZE = 100;
    const chunks = this.chunkArray(events, CHUNK_SIZE);

    for (const chunk of chunks) {
      await invoke('sync_to_firebase', {
        events: chunk,
        userToken,
      });

      // Rate limiting için kısa bekletme
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
}
