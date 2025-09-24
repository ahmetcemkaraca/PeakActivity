export interface UsageAnalyticsData {
    /**
     * Anonimleştirilmiş veya hashlenmiş kullanıcı kimliği.
     * Gerçek kullanıcı kimliği yerine gizliliği korumak için kullanılır.
     */
    anonymousUserId: string;
    /**
     * Olayın gerçekleştiği zaman damgası (ISO 8601 formatında).
     */
    timestamp: string;
    /**
     * Analiz edilen olayın türü (örneğin, "app_usage", "feature_interaction", "error_report").
     */
    eventType: string;
    /**
     * Olayla ilişkili ek veri yükü. İçindeki kişisel veriler anonimleştirilmiş olmalıdır.
     */
    payload: {
        [key: string]: any;
    };
    /**
     * Kullanıcının veri paylaşım rızası seviyesi (örneğin, "anonymous_system_data", "anonymized_usage_data").
     */
    privacyLevel: string;
} 