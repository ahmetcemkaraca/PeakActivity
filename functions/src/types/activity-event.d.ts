export interface ActivityEvent {
  id: string; // Firebase Firestore belge ID'si
  timestamp_start: string;
  timestamp_end: string;
  duration_sec: number;
  app: string;
  title: string;
  category?: string; // Kategori her zaman mevcut olmayabilir
  window_change_count: number;
  input_frequency: number;
  is_afk: boolean;
  url?: string; // URL özelliği eklendi
}
