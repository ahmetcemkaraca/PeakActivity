use zeroize::Zeroize;

pub struct SecureBytes(Vec<u8>);

impl SecureBytes {
    /// Yeni bir SecureBytes örneği oluşturur ve belleği sıfırlar.
    pub fn new(data: Vec<u8>) -> Self {
        SecureBytes(data)
    }

    /// İçeriği güvenli bir şekilde alır.
    pub fn inner(&self) -> &[u8] {
        &self.0
    }
}

impl Drop for SecureBytes {
    /// Kapsamdan çıktığında belleği otomatik olarak sıfırlar.
    fn drop(&mut self) {
        self.0.zeroize();
    }
}

/// Güvenli bir string oluşturur ve kapsamdan çıktığında sıfırlar.
pub struct SecureString(String);

impl SecureString {
    /// Yeni bir SecureString örneği oluşturur.
    pub fn new(s: String) -> Self {
        SecureString(s)
    }

    /// İçeriği güvenli bir şekilde alır.
    pub fn inner(&self) -> &str {
        &self.0
    }
}

impl Drop for SecureString {
    /// Kapsamdan çıktığında belleği otomatik olarak sıfırlar.
    fn drop(&mut self) {
        self.0.zeroize();
    }
} 