export interface EmailRecoveryToken {
  /**
   * Kurtarma jetonunun ait olduğu kullanıcının kimliği.
   */
  userId: string;
  /**
   * E-posta ile gönderilen benzersiz kurtarma jetonu.
   */
  token: string;
  /**
   * Jetonun geçerlilik süresinin dolduğu zaman damgası (ISO 8601 formatında).
   */
  expiration: string;
  /**
   * Jetonun kullanılıp kullanılmadığını belirten bayrak.
   */
  used: boolean;
  /**
   * Jetonun oluşturulduğu zaman damgası (ISO 8601 formatında).
   */
  createdAt: string;
}
