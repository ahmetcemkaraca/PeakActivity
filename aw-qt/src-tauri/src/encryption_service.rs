use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};
use rand::RngCore;

pub struct RustEncryptionService;

impl RustEncryptionService {
    /// Anahtar ve IV kullanarak veriyi şifreler.
    /// Anahtar ve IV Base64 kodlu stringler olarak verilir.
    pub fn encrypt(data: String, key_base64: String, iv_base64: String) -> Result<String, String> {
        let key_bytes = base64::decode(key_base64).map_err(|e| format!("Anahtar çözme hatası: {}", e))?;
        let iv_bytes = base64::decode(iv_base64).map_err(|e| format!("IV çözme hatası: {}", e))?;

        if key_bytes.len() != 32 { // AES-256 için 32 bayt
            return Err("Geçersiz anahtar uzunluğu. 32 bayt olmalı.".to_string());
        }
        if iv_bytes.len() != 12 { // AES-GCM için 12 bayt Nonce
            return Err("Geçersiz IV uzunluğu. 12 bayt olmalı.".to_string());
        }

        let key = Key::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        let nonce = Nonce::from_slice(&iv_bytes);

        let ciphertext = cipher.encrypt(nonce, data.as_bytes())
            .map_err(|e| format!("Şifreleme hatası: {}", e))?;

        Ok(base64::encode(&ciphertext))
    }

    /// Anahtar ve IV kullanarak şifreli veriyi çözer.
    /// Anahtar ve IV Base64 kodlu stringler olarak verilir.
    pub fn decrypt(encrypted_data_base64: String, key_base64: String, iv_base64: String) -> Result<String, String> {
        let key_bytes = base64::decode(key_base64).map_err(|e| format!("Anahtar çözme hatası: {}", e))?;
        let iv_bytes = base64::decode(iv_base64).map_err(|e| format!("IV çözme hatası: {}", e))?;

        if key_bytes.len() != 32 {
            return Err("Geçersiz anahtar uzunluğu. 32 bayt olmalı.".to_string());
        }
        if iv_bytes.len() != 12 {
            return Err("Geçersiz IV uzunluğu. 12 bayt olmalı.".to_string());
        }

        let key = Key::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        let nonce = Nonce::from_slice(&iv_bytes);

        let decrypted_bytes = cipher.decrypt(nonce, base64::decode(encrypted_data_base64).unwrap().as_ref())
            .map_err(|e| format!("Şifre çözme hatası: {}", e))?;

        Ok(String::from_utf8(decrypted_bytes).map_err(|e| format!("UTF-8 dönüşüm hatası: {}", e))?)
    }

    /// 32 baytlık rastgele bir anahtar (key) oluşturur ve Base64 olarak döndürür.
    pub fn generate_key() -> Result<String, String> {
        let mut rng = ChaCha20Rng::from_entropy();
        let mut key_bytes = [0u8; 32]; // 256-bit key
        rng.fill_bytes(&mut key_bytes);
        Ok(base64::encode(&key_bytes))
    }

    /// 12 baytlık rastgele bir IV (Initialization Vector) oluşturur ve Base64 olarak döndürür.
    pub fn generate_iv() -> Result<String, String> {
        let mut rng = ChaCha20Rng::from_entropy();
        let mut iv_bytes = [0u8; 12]; // 96-bit IV for AES-GCM
        rng.fill_bytes(&mut iv_bytes);
        Ok(base64::encode(&iv_bytes))
    }
} 