// We will disable the no-shadow eslint rule for the entire file:
/* eslint-disable no-shadow */

// Constants set at compile time
declare const PRODUCTION: boolean;
declare const AW_SERVER_URL: string;
declare const COMMIT_HASH: string;

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  // Diğer ortam değişkenlerini buraya ekleyebilirsiniz
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'aw-client' {
  export class AWClient {
    constructor(clientName: string, options?: any);
    // Temel HTTP metodları
    req: any;
    post(url: string, data?: any, config?: any): Promise<any>;
    get(url: string, params?: any): Promise<any>;

    // Bucket işlemleri
    getBuckets(): Promise<any>;
    deleteBucket(bucketId: string): Promise<any>;

    // Event işlemleri
    getEvents(bucketId: string, params?: any): Promise<any>;
    insertEvents(bucketId: string, events: any[]): Promise<any>;
    countEvents(bucketId: string): Promise<any>;

    // Query işlemleri
    query(timeperiods: any[], query: string, options?: any): Promise<any>;
    abort(): void;
    controller: AbortController;

    // Diğer metodlar
    getInfo(): Promise<any>;
    get_settings(): Promise<any>;
  }
}
