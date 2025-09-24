export interface ActivityEvent {
  id: string;
  timestamp: number;
  app_name: string;
  window_title: string;
  duration: number;
  // Diğer ActivityEvent özellikleri buraya eklenebilir
}
