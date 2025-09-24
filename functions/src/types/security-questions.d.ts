export interface SecurityQuestion {
  /**
   * Güvenlik sorusunun benzersiz kimliği.
   */
  id: string;
  /**
   * Güvenlik sorusunun metni.
   */
  question: string;
  /**
   * Sorunun hangi dilde olduğunu belirtir (örn. "tr", "en").
   */
  locale?: string;
}

export interface SecurityAnswer {
  /**
   * Cevap verilen güvenlik sorusunun kimliği.
   */
  questionId: string;
  /**
   * Cevabın bcrypt hash'i.
   */
  hashedAnswer: string;
  /**
   * Cevabın verildiği zaman damgası (ISO 8601 formatında).
   */
  timestamp: string;
}
