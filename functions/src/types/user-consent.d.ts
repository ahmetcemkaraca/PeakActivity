export interface UserConsent {
    /**
     * Kullanıcının anonim sistem verilerinin toplanmasına ilişkin rızası.
     * Bu genellikle uygulamanın performansı ve hata ayıklaması için temel verileri kapsar.
     */
    allowAnonymousSystemData: boolean;
    /**
     * Kullanıcının anonimleştirilmiş kullanım verilerinin toplanmasına ilişkin rızası.
     * Bu, belirli özelliklerin nasıl kullanıldığına dair anonimleştirilmiş metrikleri içerir.
     */
    allowAnonymizedUsageData: boolean;
    /**
     * Kullanıcının hassas kişisel verilerinin (örneğin, pencere başlıkları, detaylı loglar) toplanmasına ve işlenmesine ilişkin rızası.
     * Bu tür veriler her zaman şifrelenmeli ve çok sıkı gizlilik kontrollerine tabi olmalıdır.
     */
    allowSensitivePersonalData: boolean;
    /**
     * Rıza tercihlerinin en son güncellendiği zaman damgası (ISO 8601 formatında).
     */
    lastUpdated: string;
} 